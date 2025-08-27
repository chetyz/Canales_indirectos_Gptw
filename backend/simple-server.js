const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const db = require('./db-sqlite');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Database is now handled by SQLite

// Salesforce connection
let salesforceToken = null;
let salesforceInstanceUrl = null;

async function connectToSalesforce() {
  try {
    console.log('🔐 Conectando a Salesforce con Refresh Token...');
    console.log('DEBUG - Client ID:', process.env.SALESFORCE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('DEBUG - Client Secret:', process.env.SALESFORCE_CLIENT_SECRET ? 'PRESENT' : 'MISSING');
    console.log('DEBUG - Refresh Token:', process.env.SALESFORCE_REFRESH_TOKEN ? 'PRESENT' : 'MISSING');
    
    const response = await axios.post('https://login.salesforce.com/services/oauth2/token', 
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        refresh_token: process.env.SALESFORCE_REFRESH_TOKEN
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    salesforceToken = response.data.access_token;
    salesforceInstanceUrl = response.data.instance_url || process.env.SALESFORCE_INSTANCE_URL;
    
    console.log('✅ Conectado a Salesforce exitosamente con Refresh Token');
    console.log('Instance URL:', salesforceInstanceUrl);
    console.log('Access Token:', salesforceToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Salesforce:', error.response?.data || error.message);
    return false;
  }
}

// Auth endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Intento de login:', req.body);
    const { email, password } = req.body;
    
    const user = await db.user.findUnique({ where: { email } });
    console.log('👤 Usuario encontrado:', user ? 'SÍ' : 'NO');
    
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    
    res.json({
      message: 'Login exitoso',
      token: 'demo-token',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Register endpoint  
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'USER' } = req.body;
    
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token: 'demo-token',
      user
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Create lead (authenticated users)
app.post('/api/leads', async (req, res) => {
  try {
    console.log('📝 Recibiendo nuevo lead:', req.body);
    const { firstName, lastName, email, phone, company, position, description, submittedById } = req.body;
    
    const lead = await db.lead.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        position,
        description,
        submittedById,
        status: 'PENDING'
      },
      include: {
        submittedBy: true
      }
    });
    
    console.log('✅ Lead creado con ID:', lead.id);
    
    // Create notifications for admins
    const admins = await db.user.findMany({ where: { role: 'ADMIN' } });
    
    const notifications = admins.map(admin => ({
      userId: admin.id,
      leadId: lead.id,
      title: 'Nuevo Lead Pendiente',
      message: `${firstName} ${lastName} de ${company} ha enviado un nuevo lead para aprobación`,
      type: 'NEW_LEAD'
    }));
    
    await db.notification.createMany({ data: notifications });
    
    res.status(201).json({
      message: 'Lead enviado exitosamente y está pendiente de aprobación',
      lead: { id: lead.id, status: lead.status }
    });
  } catch (error) {
    console.error('Error creando lead:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get pending leads (admin only)
app.get('/api/leads/pending', async (req, res) => {
  try {
    const leads = await db.lead.findMany({
      where: { status: 'PENDING' },
      include: {
        submittedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    console.error('Error obteniendo leads pendientes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = status ? { status } : {};
    
    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        include: {
          submittedBy: true,
          approvedBy: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      db.lead.count({ where })
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

// Approve lead
app.post('/api/leads/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await db.lead.findUnique({
      where: { id },
      include: { submittedBy: true }
    });
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead no encontrado' });
    }
    
    if (lead.status !== 'PENDING') {
      return res.status(400).json({ message: 'El lead ya fue procesado' });
    }
    
    // Create lead in Salesforce
    let salesforceId = null;
    try {
      if (salesforceToken && salesforceInstanceUrl) {
        const leadData = {
          FirstName: lead.firstName,
          LastName: lead.lastName,
          Company: lead.company,
          Status: 'Open - Not Contacted',
          Email: lead.email,
          Phone: lead.phone || '',
          Title: lead.position || '',
          Description: lead.description || '',
          LeadSource: 'Web'
        };
        
        const salesforceResponse = await axios.post(
          `${salesforceInstanceUrl}/services/data/v58.0/sobjects/Lead`,
          leadData,
          {
            headers: {
              'Authorization': `Bearer ${salesforceToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        salesforceId = salesforceResponse.data.id;
        console.log('✅ Lead creado en Salesforce:', salesforceId);
      } else {
        console.log('⚠️ No hay conexión activa a Salesforce');
      }
    } catch (salesforceError) {
      console.error('❌ Error creando lead en Salesforce:', salesforceError.response?.data || salesforceError.message);
    }
    
    // Update lead status
    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: '1', // Default admin ID
        salesforceId
      },
      include: {
        submittedBy: true,
        approvedBy: true
      }
    });
    
    // Create notification
    await db.notification.create({
      data: {
        userId: lead.submittedById,
        leadId: lead.id,
        title: 'Lead Aprobado',
        message: `Tu lead para ${lead.company} ha sido aprobado y enviado a Salesforce`,
        type: 'LEAD_APPROVED'
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

// Reject lead
app.post('/api/leads/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const lead = leads.find(l => l.id === id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead no encontrado' });
    }
    
    if (lead.status !== 'PENDING') {
      return res.status(400).json({ message: 'El lead ya fue procesado' });
    }
    
    lead.status = 'REJECTED';
    lead.rejectedAt = new Date();
    if (reason) {
      lead.rejectionReason = reason;
    }
    
    res.json({
      message: 'Lead rechazado',
      lead
    });
  } catch (error) {
    console.error('Error rechazando lead:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Test Salesforce connection
app.get('/api/leads/test-salesforce', async (req, res) => {
  try {
    const isConnected = await connectToSalesforce();
    if (isConnected && salesforceToken && salesforceInstanceUrl) {
      // Get user info
      const userInfo = await axios.get(
        `${salesforceInstanceUrl}/services/oauth2/userinfo`,
        {
          headers: {
            'Authorization': `Bearer ${salesforceToken}`
          }
        }
      );
      
      res.json({
        success: true,
        user: userInfo.data.name,
        email: userInfo.data.email,
        organization: userInfo.data.organization_id,
        instanceUrl: salesforceInstanceUrl
      });
    } else {
      res.json({
        success: false,
        error: 'No se pudo conectar a Salesforce'
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// User profile
app.get('/api/users/profile', (req, res) => {
  // For demo, return admin user
  const user = users[0];
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: '2024-01-01'
  });
});

// User stats
app.get('/api/users/stats', async (req, res) => {
  try {
    const [totalSubmitted, pending, approved, rejected] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { status: 'PENDING' } }),
      db.lead.count({ where: { status: 'APPROVED' } }),
      db.lead.count({ where: { status: 'REJECTED' } })
    ]);
    
    res.json({
      totalSubmitted,
      totalApproved: approved,
      byStatus: {
        pending,
        approved,
        rejected
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await db.notification.findMany({
      where: { userId: '1' }, // Default to admin for demo
    });
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    res.json({
      notifications,
      pagination: { currentPage: 1, totalPages: 1, totalItems: notifications.length },
      unreadCount
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const count = await db.notification.findMany({
      where: { userId: '1', read: false } // Default to admin for demo
    });
    res.json({ count: count.length });
  } catch (error) {
    console.error('Error obteniendo conteo de notificaciones:', error);
    res.json({ count: 0 });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Sample data is now loaded from database initialization

const PORT = process.env.PORT || 4000;

// Initialize Salesforce connection
connectToSalesforce();

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 API disponible en: http://localhost:${PORT}/api/`);
});