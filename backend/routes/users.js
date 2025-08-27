const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Obtener perfil del usuario actual
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener todos los usuarios (solo admins)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              submittedLeads: true,
              approvedLeads: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener estadísticas del usuario (leads enviados)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        _count: {
          select: {
            submittedLeads: true,
            approvedLeads: req.user.role === 'ADMIN' ? true : false
          }
        }
      }
    });

    const leadStats = await prisma.lead.groupBy({
      by: ['status'],
      where: { submittedById: req.user.id },
      _count: true
    });

    const formattedStats = {
      totalSubmitted: stats._count.submittedLeads,
      ...(req.user.role === 'ADMIN' && { totalApproved: stats._count.approvedLeads }),
      byStatus: leadStats.reduce((acc, curr) => {
        acc[curr.status.toLowerCase()] = curr._count;
        return acc;
      }, {})
    };

    res.json(formattedStats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;