require('dotenv').config();
const axios = require('axios');

async function testSalesforceDirectly() {
  console.log('🔐 Probando conexión directa a Salesforce...');
  
  try {
    const response = await axios.post('https://login.salesforce.com/services/oauth2/token', 
      new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        username: process.env.SALESFORCE_USERNAME,
        password: process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('✅ Conexión exitosa!');
    console.log('Access Token:', response.data.access_token.substring(0, 20) + '...');
    console.log('Instance URL:', response.data.instance_url);
    
    // Test creating a lead
    const leadData = {
      FirstName: 'Test',
      LastName: 'Lead',
      Company: 'Test Company',
      Status: 'Open - Not Contacted',
      Email: 'test@example.com',
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
    
    console.log('✅ Lead creado exitosamente!');
    console.log('Lead ID:', leadResponse.data.id);
    
    return {
      success: true,
      accessToken: response.data.access_token,
      instanceUrl: response.data.instance_url,
      leadId: leadResponse.data.id
    };
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Ejecutar la prueba
testSalesforceDirectly();