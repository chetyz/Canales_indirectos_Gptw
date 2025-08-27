const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// In-memory storage (for demo purposes)
let leads = [];
let users = [
  {
    id: '1',
    email: 'admin@leadmanager.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'System',
    role: 'ADMIN'
  },
  {
    id: '2',
    email: 'user@leadmanager.com',
    password: 'user123',
    firstName: 'Usuario',
    lastName: 'Demo',
    role: 'USER'
  },
  {
    id: 'guest-user-id',
    email: 'guest@system.com',
    password: 'no-password',
    firstName: 'Visitante',
    lastName: 'Anónimo',
    role: 'GUEST'
  }
];

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
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Intento de login:', req.body);
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  console.log('👤 Usuario encontrado:', user ? 'SÍ' : 'NO');
  
  if (user) {
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
  } else {
    res.status(400).json({ message: 'Credenciales inválidas' });
  }
});

// Register endpoint  
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, role = 'USER' } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }
  
  const newUser = {
    id: String(users.length + 1),
    email,
    password,
    firstName,
    lastName,
    role
  };
  
  users.push(newUser);
  
  res.status(201).json({
    message: 'Usuario creado exitosamente',
    token: 'demo-token',
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role
    }
  });
});

// Create lead (public)
app.post('/api/leads', async (req, res) => {
  try {
    console.log('📝 Recibiendo nuevo lead:', req.body);
    const { firstName, lastName, email, phone, company, position, description, submittedById } = req.body;
    
    const newLead = {
      id: String(leads.length + 1),
      firstName,
      lastName,
      email,
      phone,
      company,
      position,
      description,
      status: 'PENDING',
      createdAt: new Date(),
      submittedById: submittedById || 'guest-user-id' // Use provided ID or default to guest
    };
    
    console.log('✅ Lead creado con ID:', newLead.id);
    
    leads.push(newLead);
    
    res.status(201).json({
      message: 'Lead enviado exitosamente y está pendiente de aprobación',
      lead: { id: newLead.id, status: newLead.status }
    });
  } catch (error) {
    console.error('Error creando lead:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get pending leads (admin only)
app.get('/api/leads/pending', (req, res) => {
  const pendingLeads = leads.filter(lead => lead.status === 'PENDING');
  res.json(pendingLeads);
});

// Get all leads
app.get('/api/leads', (req, res) => {
  const { status } = req.query;
  let filteredLeads = leads;
  
  if (status) {
    filteredLeads = leads.filter(lead => lead.status === status);
  }
  
  res.json({ leads: filteredLeads });
});

// Approve lead
app.post('/api/leads/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const lead = leads.find(l => l.id === id);
    
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
    lead.status = 'APPROVED';
    lead.salesforceId = salesforceId;
    lead.approvedAt = new Date();
    
    res.json({
      message: 'Lead aprobado exitosamente',
      lead,
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
app.get('/api/users/stats', (req, res) => {
  const totalSubmitted = leads.length;
  const pending = leads.filter(l => l.status === 'PENDING').length;
  const approved = leads.filter(l => l.status === 'APPROVED').length;
  const rejected = leads.filter(l => l.status === 'REJECTED').length;
  
  res.json({
    totalSubmitted,
    totalApproved: approved,
    byStatus: {
      pending,
      approved,
      rejected
    }
  });
});

// Notifications
app.get('/api/notifications', (req, res) => {
  res.json({
    notifications: [],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
    unreadCount: 0
  });
});

app.get('/api/notifications/unread-count', (req, res) => {
  res.json({ count: 0 });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Add some sample data
leads.push(
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@empresa.com',
    phone: '+54 11 1234-5678',
    company: 'Empresa ABC S.A.',
    position: 'Gerente de Ventas',
    description: 'Interesado en nuestros servicios de consultoría',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    submittedById: '2'
  },
  {
    id: '2',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@techcorp.com',
    phone: '+54 11 9876-5432',
    company: 'TechCorp Solutions',
    position: 'Directora de Marketing',
    description: 'Necesita soluciones de automatización para su equipo',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    submittedById: '2',
    salesforceId: 'SF_12345'
  }
);

const PORT = process.env.PORT || 4000;

// Initialize Salesforce connection
connectToSalesforce();

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 API disponible en: http://localhost:${PORT}/api/`);
});