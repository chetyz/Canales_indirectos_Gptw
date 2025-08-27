const jsforce = require('jsforce');

class SalesforceService {
  constructor() {
    this.connection = new jsforce.Connection({
      loginUrl: process.env.SALESFORCE_INSTANCE_URL
    });
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        return this.connection;
      }

      const loginResult = await this.connection.login(
        process.env.SALESFORCE_USERNAME,
        process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN
      );

      this.isConnected = true;
      console.log('Conectado a Salesforce:', loginResult.id);
      return this.connection;
    } catch (error) {
      console.error('Error conectando a Salesforce:', error);
      throw new Error('No se pudo conectar a Salesforce');
    }
  }

  async createLead(leadData) {
    try {
      await this.connect();

      const salesforceLead = {
        FirstName: leadData.firstName,
        LastName: leadData.lastName,
        Company: leadData.company,
        Status: 'Open - Not Contacted',
        Email: leadData.email,
        Phone: leadData.phone || '',
        Title: leadData.position || '',
        Description: leadData.description || '',
        LeadSource: 'Web'
      };

      const result = await this.connection.sobject('Lead').create(salesforceLead);
      
      if (result.success) {
        console.log('Lead creado en Salesforce:', result.id);
        return {
          success: true,
          salesforceId: result.id
        };
      } else {
        console.error('Error creando lead en Salesforce:', result);
        throw new Error('Error creando lead en Salesforce');
      }
    } catch (error) {
      console.error('Error en createLead:', error);
      throw error;
    }
  }

  async updateLead(salesforceId, updateData) {
    try {
      await this.connect();

      const result = await this.connection.sobject('Lead').update({
        Id: salesforceId,
        ...updateData
      });

      if (result.success) {
        console.log('Lead actualizado en Salesforce:', salesforceId);
        return { success: true };
      } else {
        console.error('Error actualizando lead:', result);
        throw new Error('Error actualizando lead en Salesforce');
      }
    } catch (error) {
      console.error('Error en updateLead:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.connect();
      const identity = await this.connection.identity();
      return {
        success: true,
        user: identity.display_name,
        organization: identity.organization_id
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SalesforceService();