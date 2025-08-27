const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

async function initializeDatabase() {
  return new Promise(async (resolve, reject) => {
    const dbPath = path.join(__dirname, 'dev.db');
    const db = new sqlite3.Database(dbPath);

    console.log('Inicializando base de datos SQLite...');

    db.serialize(async () => {
      // Crear tabla users
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          role TEXT DEFAULT 'USER',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Crear tabla leads
      db.run(`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          company TEXT NOT NULL,
          position TEXT,
          description TEXT,
          status TEXT DEFAULT 'PENDING',
          salesforceId TEXT,
          submittedById TEXT NOT NULL,
          approvedById TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(submittedById) REFERENCES users(id),
          FOREIGN KEY(approvedById) REFERENCES users(id)
        )
      `);

      // Crear tabla notifications
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          read INTEGER DEFAULT 0,
          userId TEXT NOT NULL,
          leadId TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(userId) REFERENCES users(id),
          FOREIGN KEY(leadId) REFERENCES leads(id)
        )
      `);

      // Generar IDs únicos
      function generateId() {
        return 'clc' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      }

      // Crear usuario admin
      const adminId = generateId();
      const hashedAdminPassword = await bcrypt.hash('admin123', 12);
      
      db.run(`
        INSERT OR REPLACE INTO users (id, email, password, firstName, lastName, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [adminId, 'admin@leadmanager.com', hashedAdminPassword, 'Admin', 'System', 'ADMIN']);

      // Crear usuario demo
      const userId = generateId();
      const hashedUserPassword = await bcrypt.hash('user123', 12);
      
      db.run(`
        INSERT OR REPLACE INTO users (id, email, password, firstName, lastName, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, 'user@leadmanager.com', hashedUserPassword, 'Usuario', 'Demo', 'USER']);

      // Crear leads de ejemplo
      const lead1Id = generateId();
      const lead2Id = generateId();
      const lead3Id = generateId();

      db.run(`
        INSERT OR REPLACE INTO leads (id, firstName, lastName, email, phone, company, position, description, submittedById, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [lead1Id, 'Juan', 'Pérez', 'juan.perez@empresa.com', '+54 11 1234-5678', 'Empresa ABC S.A.', 'Gerente de Ventas', 'Interesado en nuestros servicios de consultoría', userId, 'PENDING']);

      db.run(`
        INSERT OR REPLACE INTO leads (id, firstName, lastName, email, phone, company, position, description, submittedById, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [lead2Id, 'María', 'González', 'maria.gonzalez@techcorp.com', '+54 11 9876-5432', 'TechCorp Solutions', 'Directora de Marketing', 'Necesita soluciones de automatización para su equipo', userId, 'PENDING']);

      db.run(`
        INSERT OR REPLACE INTO leads (id, firstName, lastName, email, phone, company, position, description, submittedById, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [lead3Id, 'Carlos', 'Rodríguez', 'carlos@startup.io', '', 'StartupInnovate', 'CEO', 'Startup buscando escalabilidad en sus procesos', userId, 'APPROVED']);

      console.log('✅ Base de datos inicializada correctamente');
      console.log('📝 Credenciales para pruebas:');
      console.log('   👤 Admin: admin@leadmanager.com / admin123');
      console.log('   👤 Usuario: user@leadmanager.com / user123');
      
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Inicialización completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error inicializando base de datos:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;