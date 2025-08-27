const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to generate unique ID (similar to Prisma's cuid)
const generateId = () => {
  return 'clc' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const dbOperations = {
  // User operations
  user: {
    findUnique: async ({ where }) => {
      let query;
      let params;
      
      if (where.id) {
        query = 'SELECT * FROM users WHERE id = $1';
        params = [where.id];
      } else if (where.email) {
        query = 'SELECT * FROM users WHERE email = $1';
        params = [where.email];
      }
      
      const result = await pool.query(query, params);
      return result.rows[0] || null;
    },
    
    findMany: async ({ where = {} }) => {
      let query = 'SELECT * FROM users';
      const params = [];
      
      if (where.role) {
        query += ' WHERE role = $1';
        params.push(where.role);
      }
      
      const result = await pool.query(query, params);
      return result.rows;
    },
    
    create: async ({ data, select = {} }) => {
      const id = generateId();
      const now = new Date().toISOString();
      
      const query = `
        INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        id,
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.role || 'USER',
        now,
        now
      ]);
      
      const user = result.rows[0];
      
      // Apply select filter if provided
      if (Object.keys(select).length > 0) {
        const filtered = {};
        Object.keys(select).forEach(key => {
          if (select[key] && user[key] !== undefined) {
            filtered[key] = user[key];
          }
        });
        return filtered;
      }
      
      return user;
    }
  },
  
  // Lead operations
  lead: {
    create: async ({ data, include = {} }) => {
      const id = generateId();
      const now = new Date().toISOString();
      
      const query = `
        INSERT INTO leads (id, "firstName", "lastName", email, phone, company, position, description, status, "submittedById", "approvedById", "salesforceId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        id,
        data.firstName,
        data.lastName,
        data.email,
        data.phone || null,
        data.company,
        data.position || null,
        data.description || null,
        data.status || 'PENDING',
        data.submittedById,
        data.approvedById || null,
        data.salesforceId || null,
        now,
        now
      ]);
      
      let lead = result.rows[0];
      
      // Handle includes
      if (include.submittedBy) {
        const userResult = await pool.query('SELECT "firstName", "lastName", email FROM users WHERE id = $1', [lead.submittedById]);
        lead.submittedBy = userResult.rows[0];
      }
      
      if (include.approvedBy && lead.approvedById) {
        const userResult = await pool.query('SELECT "firstName", "lastName", email FROM users WHERE id = $1', [lead.approvedById]);
        lead.approvedBy = userResult.rows[0];
      }
      
      return lead;
    },
    
    findMany: async ({ where = {}, include = {}, orderBy = {}, skip = 0, take }) => {
      let query = 'SELECT * FROM leads';
      const params = [];
      const conditions = [];
      let paramCount = 0;
      
      if (where.status) {
        paramCount++;
        conditions.push(`status = $${paramCount}`);
        params.push(where.status);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      if (orderBy.createdAt === 'desc') {
        query += ' ORDER BY "createdAt" DESC';
      }
      
      if (take) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(take);
        
        if (skip > 0) {
          paramCount++;
          query += ` OFFSET $${paramCount}`;
          params.push(skip);
        }
      }
      
      const result = await pool.query(query, params);
      const leads = result.rows;
      
      // Handle includes
      for (let lead of leads) {
        if (include.submittedBy) {
          const userResult = await pool.query('SELECT "firstName", "lastName", email FROM users WHERE id = $1', [lead.submittedById]);
          lead.submittedBy = userResult.rows[0];
        }
        
        if (include.approvedBy && lead.approvedById) {
          const userResult = await pool.query('SELECT "firstName", "lastName", email FROM users WHERE id = $1', [lead.approvedById]);
          lead.approvedBy = userResult.rows[0];
        }
      }
      
      return leads;
    },
    
    findUnique: async ({ where, include = {} }) => {
      const result = await pool.query('SELECT * FROM leads WHERE id = $1', [where.id]);
      const lead = result.rows[0];
      
      if (!lead) return null;
      
      // Handle includes
      if (include.submittedBy) {
        const userResult = await pool.query('SELECT "firstName", "lastName", email FROM users WHERE id = $1', [lead.submittedById]);
        lead.submittedBy = userResult.rows[0];
      }
      
      if (include.approvedBy && lead.approvedById) {
        const userResult = await pool.query('SELECT "firstName", "lastName", email FROM users WHERE id = $1', [lead.approvedById]);
        lead.approvedBy = userResult.rows[0];
      }
      
      return lead;
    },
    
    update: async ({ where, data, include = {} }) => {
      const now = new Date().toISOString();
      
      const query = `
        UPDATE leads 
        SET status = $1, "approvedById" = $2, "salesforceId" = $3, description = $4, "updatedAt" = $5
        WHERE id = $6
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        data.status || null,
        data.approvedById || null,
        data.salesforceId || null,
        data.description || null,
        now,
        where.id
      ]);
      
      const lead = result.rows[0];
      
      // Handle includes
      if (include.submittedBy) {
        const userResult = await pool.query('SELECT "firstName", "lastName", email FROM users WHERE id = $1', [lead.submittedById]);
        lead.submittedBy = userResult.rows[0];
      }
      
      if (include.approvedBy && lead.approvedById) {
        const userResult = await pool.query('SELECT "firstName", "lastName", email FROM users WHERE id = $1', [lead.approvedById]);
        lead.approvedBy = userResult.rows[0];
      }
      
      return lead;
    },
    
    count: async ({ where = {} }) => {
      let query = 'SELECT COUNT(*) as count FROM leads';
      const params = [];
      
      if (where.status) {
        query += ' WHERE status = $1';
        params.push(where.status);
      }
      
      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count);
    }
  },
  
  // Notification operations
  notification: {
    create: async ({ data }) => {
      const id = generateId();
      const now = new Date().toISOString();
      
      const query = `
        INSERT INTO notifications (id, title, message, type, read, "userId", "leadId", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        id,
        data.title,
        data.message,
        data.type,
        data.read || false,
        data.userId,
        data.leadId || null,
        now
      ]);
      
      return result.rows[0];
    },
    
    createMany: async ({ data }) => {
      const promises = data.map(notification => dbOperations.notification.create({ data: notification }));
      return await Promise.all(promises);
    },
    
    findMany: async ({ where = {} }) => {
      let query = 'SELECT * FROM notifications';
      const params = [];
      const conditions = [];
      let paramCount = 0;
      
      if (where.userId) {
        paramCount++;
        conditions.push(`"userId" = $${paramCount}`);
        params.push(where.userId);
      }
      
      if (where.read !== undefined) {
        paramCount++;
        conditions.push(`read = $${paramCount}`);
        params.push(where.read);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY "createdAt" DESC';
      
      const result = await pool.query(query, params);
      return result.rows;
    }
  },

  // Initialize database tables
  initTables: async () => {
    const client = await pool.connect();
    
    try {
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          role TEXT DEFAULT 'USER',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create leads table
      await client.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          company TEXT NOT NULL,
          position TEXT,
          description TEXT,
          status TEXT DEFAULT 'PENDING',
          "salesforceId" TEXT,
          "submittedById" TEXT NOT NULL,
          "approvedById" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY("submittedById") REFERENCES users(id),
          FOREIGN KEY("approvedById") REFERENCES users(id)
        )
      `);

      // Create notifications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          "userId" TEXT NOT NULL,
          "leadId" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY("userId") REFERENCES users(id),
          FOREIGN KEY("leadId") REFERENCES leads(id)
        )
      `);

      console.log('✅ PostgreSQL tables created/verified');
      
    } finally {
      client.release();
    }
  }
};

// Test connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    throw err;
  }
}

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

// Test connection immediately (but don't throw if it fails during startup)
testConnection().catch(err => {
  console.error('❌ PostgreSQL connection failed during startup:', err.message);
  console.log('⚠️  Server will continue but database operations may fail');
});

module.exports = dbOperations;