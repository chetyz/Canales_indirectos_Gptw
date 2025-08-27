const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath);

// Helper function to promisify database operations
const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Generate unique ID (similar to Prisma's cuid)
const generateId = () => {
  return 'clc' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const dbOperations = {
  // User operations
  user: {
    findUnique: async ({ where }) => {
      let query = 'SELECT * FROM users WHERE ';
      const params = [];
      
      if (where.id) {
        query += 'id = ?';
        params.push(where.id);
      } else if (where.email) {
        query += 'email = ?';
        params.push(where.email);
      }
      
      return await dbGet(query, params);
    },
    
    findMany: async ({ where = {} }) => {
      let query = 'SELECT * FROM users';
      const params = [];
      
      if (where.role) {
        query += ' WHERE role = ?';
        params.push(where.role);
      }
      
      return await dbAll(query, params);
    },
    
    create: async ({ data, select = {} }) => {
      const id = generateId();
      const now = new Date().toISOString();
      
      const query = `
        INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await dbRun(query, [
        id,
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.role || 'USER',
        now,
        now
      ]);
      
      const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
      
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
        INSERT INTO leads (id, firstName, lastName, email, phone, company, position, description, status, submittedById, approvedById, salesforceId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await dbRun(query, [
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
      
      let lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
      
      // Handle includes
      if (include.submittedBy) {
        const submittedBy = await dbGet('SELECT firstName, lastName, email FROM users WHERE id = ?', [lead.submittedById]);
        lead.submittedBy = submittedBy;
      }
      
      if (include.approvedBy && lead.approvedById) {
        const approvedBy = await dbGet('SELECT firstName, lastName, email FROM users WHERE id = ?', [lead.approvedById]);
        lead.approvedBy = approvedBy;
      }
      
      return lead;
    },
    
    findMany: async ({ where = {}, include = {}, orderBy = {}, skip = 0, take }) => {
      let query = 'SELECT * FROM leads';
      const params = [];
      const conditions = [];
      
      if (where.status) {
        conditions.push('status = ?');
        params.push(where.status);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      if (orderBy.createdAt === 'desc') {
        query += ' ORDER BY createdAt DESC';
      }
      
      if (take) {
        query += ' LIMIT ? OFFSET ?';
        params.push(take, skip);
      }
      
      const leads = await dbAll(query, params);
      
      // Handle includes
      for (let lead of leads) {
        if (include.submittedBy) {
          const submittedBy = await dbGet('SELECT firstName, lastName, email FROM users WHERE id = ?', [lead.submittedById]);
          lead.submittedBy = submittedBy;
        }
        
        if (include.approvedBy && lead.approvedById) {
          const approvedBy = await dbGet('SELECT firstName, lastName, email FROM users WHERE id = ?', [lead.approvedById]);
          lead.approvedBy = approvedBy;
        }
      }
      
      return leads;
    },
    
    findUnique: async ({ where, include = {} }) => {
      const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [where.id]);
      
      if (!lead) return null;
      
      // Handle includes
      if (include.submittedBy) {
        const submittedBy = await dbGet('SELECT firstName, lastName, email FROM users WHERE id = ?', [lead.submittedById]);
        lead.submittedBy = submittedBy;
      }
      
      if (include.approvedBy && lead.approvedById) {
        const approvedBy = await dbGet('SELECT firstName, lastName, email FROM users WHERE id = ?', [lead.approvedById]);
        lead.approvedBy = approvedBy;
      }
      
      return lead;
    },
    
    update: async ({ where, data, include = {} }) => {
      const now = new Date().toISOString();
      
      const query = `
        UPDATE leads 
        SET status = ?, approvedById = ?, salesforceId = ?, description = ?, updatedAt = ?
        WHERE id = ?
      `;
      
      await dbRun(query, [
        data.status || null,
        data.approvedById || null,
        data.salesforceId || null,
        data.description || null,
        now,
        where.id
      ]);
      
      return await dbOperations.lead.findUnique({ where, include });
    },
    
    count: async ({ where = {} }) => {
      let query = 'SELECT COUNT(*) as count FROM leads';
      const params = [];
      
      if (where.status) {
        query += ' WHERE status = ?';
        params.push(where.status);
      }
      
      const result = await dbGet(query, params);
      return result.count;
    }
  },
  
  // Notification operations
  notification: {
    create: async ({ data }) => {
      const id = generateId();
      const now = new Date().toISOString();
      
      const query = `
        INSERT INTO notifications (id, title, message, type, read, userId, leadId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await dbRun(query, [
        id,
        data.title,
        data.message,
        data.type,
        data.read || false,
        data.userId,
        data.leadId || null,
        now
      ]);
      
      return await dbGet('SELECT * FROM notifications WHERE id = ?', [id]);
    },
    
    createMany: async ({ data }) => {
      const promises = data.map(notification => dbOperations.notification.create({ data: notification }));
      return await Promise.all(promises);
    },
    
    findMany: async ({ where = {} }) => {
      let query = 'SELECT * FROM notifications';
      const params = [];
      
      if (where.userId) {
        query += ' WHERE userId = ?';
        params.push(where.userId);
      }
      
      query += ' ORDER BY createdAt DESC';
      
      return await dbAll(query, params);
    }
  }
};

module.exports = dbOperations;