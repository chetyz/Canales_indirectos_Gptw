require('dotenv').config();
const axios = require('axios');

async function testRefreshToken() {
  console.log('🔐 Probando Refresh Token...');
  console.log('Client ID:', process.env.SALESFORCE_CLIENT_ID);
  console.log('Client Secret:', process.env.SALESFORCE_CLIENT_SECRET?.substring(0, 10) + '...');
  console.log('Refresh Token:', process.env.SALESFORCE_REFRESH_TOKEN?.substring(0, 20) + '...');
  
  try {
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
    
    console.log('✅ Refresh Token funciona!');
    console.log('Access Token:', response.data.access_token.substring(0, 20) + '...');
    console.log('Instance URL:', response.data.instance_url);
    
    // Test crear lead
    const leadData = {
      FirstName: 'Test Refresh',
      LastName: 'Token Lead',
      Company: 'Test Company RT',
      Status: 'Open - Not Contacted',
      Email: 'testrt@example.com',
      LeadSource: 'Web'
    };
    
    console.log('\n📝 Creando lead de prueba...');
    
    const leadResponse = await axios.post(
      `${response.data.instance_url}/services/data/v58.0/sobjects/Lead`,
      leadData,
      {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Lead creado exitosamente con Refresh Token!');
    console.log('Lead ID:', leadResponse.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data?.error === 'invalid_client_id') {
      console.log('\n🔍 Posibles causas:');
      console.log('1. Client ID incorrecto en .env');
      console.log('2. Connected App no configurada correctamente');
      console.log('3. Refresh Token generado con diferentes credenciales');
    }
  }
}

testRefreshToken();