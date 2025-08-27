const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Inicializando base de datos...');

  try {
    // Crear usuario administrador por defecto
    const adminEmail = 'admin@leadmanager.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'System',
          role: 'ADMIN'
        }
      });

      console.log('✅ Usuario administrador creado:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: admin123`);
      console.log(`   ID: ${admin.id}`);
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }

    // Crear usuario demo para enviar leads
    const userEmail = 'user@leadmanager.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('user123', 12);
      
      const user = await prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          firstName: 'Usuario',
          lastName: 'Demo',
          role: 'USER'
        }
      });

      console.log('✅ Usuario demo creado:');
      console.log(`   Email: ${userEmail}`);
      console.log(`   Password: user123`);
      console.log(`   ID: ${user.id}`);
    } else {
      console.log('ℹ️  Usuario demo ya existe');
    }

    // Crear algunos leads de ejemplo si no existen
    const leadCount = await prisma.lead.count();
    
    if (leadCount === 0) {
      const demoUser = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (demoUser) {
        const sampleLeads = [
          {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan.perez@empresa.com',
            phone: '+54 11 1234-5678',
            company: 'Empresa ABC S.A.',
            position: 'Gerente de Ventas',
            description: 'Interesado en nuestros servicios de consultoría',
            submittedById: demoUser.id,
            status: 'PENDING'
          },
          {
            firstName: 'María',
            lastName: 'González',
            email: 'maria.gonzalez@techcorp.com',
            phone: '+54 11 9876-5432',
            company: 'TechCorp Solutions',
            position: 'Directora de Marketing',
            description: 'Necesita soluciones de automatización para su equipo',
            submittedById: demoUser.id,
            status: 'PENDING'
          },
          {
            firstName: 'Carlos',
            lastName: 'Rodríguez',
            email: 'carlos@startup.io',
            company: 'StartupInnovate',
            position: 'CEO',
            description: 'Startup buscando escalabilidad en sus procesos',
            submittedById: demoUser.id,
            status: 'APPROVED'
          }
        ];

        await prisma.lead.createMany({
          data: sampleLeads
        });

        console.log(`✅ ${sampleLeads.length} leads de ejemplo creados`);
      }
    } else {
      console.log('ℹ️  Ya existen leads en la base de datos');
    }

    console.log('\n🎉 Inicialización completada exitosamente!');
    console.log('\n📝 Credenciales para pruebas:');
    console.log('   👤 Admin: admin@leadmanager.com / admin123');
    console.log('   👤 Usuario: user@leadmanager.com / user123');
    console.log('\n🚀 Inicia la aplicación con: npm run dev');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error inesperado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });