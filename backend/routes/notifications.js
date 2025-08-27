const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Obtener notificaciones del usuario autenticado
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(unreadOnly === 'true' && { read: false })
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user.id, read: false }
      })
    ]);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Marcar notificación como leída
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Marcar todas las notificaciones como leídas
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false
      },
      data: { read: true }
    });

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener conteo de notificaciones no leídas
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error obteniendo conteo de notificaciones no leídas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;