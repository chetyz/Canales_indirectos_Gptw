const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const salesforceService = require('../services/salesforce');

const router = express.Router();
const prisma = new PrismaClient();

// Crear nuevo lead (público - no requiere autenticación para el formulario)
router.post('/', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('company').notEmpty().trim(),
  body('phone').optional().trim(),
  body('position').optional().trim(),
  body('description').optional().trim(),
  body('submittedById').notEmpty() // ID del usuario que submite (puede ser un usuario genérico)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, company, phone, position, description, submittedById } = req.body;

    // Crear lead en la base de datos
    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email,
        company,
        phone,
        position,
        description,
        submittedById,
        status: 'PENDING'
      },
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    // Crear notificaciones para todos los admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    const notifications = admins.map(admin => ({
      userId: admin.id,
      leadId: lead.id,
      title: 'Nuevo Lead Pendiente',
      message: `${firstName} ${lastName} de ${company} ha enviado un nuevo lead para aprobación`,
      type: 'NEW_LEAD'
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    // Enviar notificación en tiempo real a los admins
    const io = req.app.get('socketio');
    admins.forEach(admin => {
      io.to(`admin-${admin.id}`).emit('new-lead', {
        lead,
        notification: {
          title: 'Nuevo Lead Pendiente',
          message: `${firstName} ${lastName} de ${company} ha enviado un nuevo lead para aprobación`
        }
      });
    });

    res.status(201).json({
      message: 'Lead enviado exitosamente y está pendiente de aprobación',
      lead: {
        id: lead.id,
        status: lead.status
      }
    });
  } catch (error) {
    console.error('Error creando lead:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener leads pendientes (solo admins)
router.get('/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { status: 'PENDING' },
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(leads);
  } catch (error) {
    console.error('Error obteniendo leads pendientes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener todos los leads con filtros (solo admins)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = status ? { status } : {};

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          submittedBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          approvedBy: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      leads,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo leads:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Aprobar lead (solo admins)
router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el lead existe y está pendiente
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead no encontrado' });
    }

    if (lead.status !== 'PENDING') {
      return res.status(400).json({ message: 'El lead ya fue procesado' });
    }

    // Crear lead en Salesforce
    let salesforceId = null;
    try {
      const salesforceResult = await salesforceService.createLead(lead);
      salesforceId = salesforceResult.salesforceId;
    } catch (salesforceError) {
      console.error('Error creando lead en Salesforce:', salesforceError);
      // Continuar con la aprobación local aunque falle Salesforce
    }

    // Actualizar lead en la base de datos
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        salesforceId
      },
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true, email: true }
        },
        approvedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    // Crear notificación para el usuario que envió el lead
    await prisma.notification.create({
      data: {
        userId: lead.submittedById,
        leadId: lead.id,
        title: 'Lead Aprobado',
        message: `Tu lead para ${lead.company} ha sido aprobado y enviado a Salesforce`,
        type: 'LEAD_APPROVED'
      }
    });

    // Notificación en tiempo real
    const io = req.app.get('socketio');
    io.to(`admin-${lead.submittedById}`).emit('lead-approved', {
      lead: updatedLead,
      notification: {
        title: 'Lead Aprobado',
        message: `Tu lead para ${lead.company} ha sido aprobado y enviado a Salesforce`
      }
    });

    res.json({
      message: 'Lead aprobado exitosamente',
      lead: updatedLead,
      salesforceCreated: !!salesforceId
    });
  } catch (error) {
    console.error('Error aprobando lead:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Rechazar lead (solo admins)
router.post('/:id/reject', authenticateToken, requireAdmin, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Verificar que el lead existe y está pendiente
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead no encontrado' });
    }

    if (lead.status !== 'PENDING') {
      return res.status(400).json({ message: 'El lead ya fue procesado' });
    }

    // Actualizar lead en la base de datos
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        description: reason ? `${lead.description || ''}\n\nRazón de rechazo: ${reason}` : lead.description
      },
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true, email: true }
        },
        approvedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    // Crear notificación para el usuario que envió el lead
    await prisma.notification.create({
      data: {
        userId: lead.submittedById,
        leadId: lead.id,
        title: 'Lead Rechazado',
        message: `Tu lead para ${lead.company} ha sido rechazado${reason ? ': ' + reason : ''}`,
        type: 'LEAD_REJECTED'
      }
    });

    // Notificación en tiempo real
    const io = req.app.get('socketio');
    io.to(`admin-${lead.submittedById}`).emit('lead-rejected', {
      lead: updatedLead,
      notification: {
        title: 'Lead Rechazado',
        message: `Tu lead para ${lead.company} ha sido rechazado${reason ? ': ' + reason : ''}`
      }
    });

    res.json({
      message: 'Lead rechazado',
      lead: updatedLead
    });
  } catch (error) {
    console.error('Error rechazando lead:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Test Salesforce connection (solo admins)
router.get('/test-salesforce', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await salesforceService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing Salesforce:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error del servidor' 
    });
  }
});

module.exports = router;