const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Probando login...');
    
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'user@leadmanager.com',
      password: 'user123'
    });
    
    console.log('✅ Login exitoso:', response.data);
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
  }
}

async function testLeadSubmission() {
  try {
    console.log('\n📝 Probando envío de lead...');
    
    const response = await axios.post('http://localhost:4000/api/leads', {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      company: 'Test Company',
      phone: '123-456-7890',
      position: 'Test Position',
      description: 'Test description',
      submittedById: 'guest-user-id'
    });
    
    console.log('✅ Lead enviado exitosamente:', response.data);
  } catch (error) {
    console.error('❌ Error enviando lead:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
testLogin();
setTimeout(testLeadSubmission, 1000);