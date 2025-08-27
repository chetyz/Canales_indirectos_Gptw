# 🚀 Lead Management System - Salesforce Integration

Sistema de gestión de leads con integración automática a Salesforce. Los usuarios pueden enviar leads que son aprobados por administradores y enviados automáticamente a Salesforce.

## 📊 Stack Tecnológico

**PERN Stack** (PostgreSQL + Express + React + Node.js)
- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + Express  
- **Database**: PostgreSQL + Prisma ORM
- **Integration**: Salesforce OAuth2
- **Deploy**: Vercel (Frontend) + Railway/Render (Backend)

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + Express)
- **Autenticación JWT** segura
- **API REST** completa  
- **Integración Salesforce** OAuth2
- **Notificaciones** en tiempo real
- **Base de datos** PostgreSQL

### Frontend (React 18)
- **Dashboard** de usuario y admin
- **Formularios** de leads
- **Autenticación** completa
- **Notificaciones** en tiempo real
- **Responsive design**

## 📋 Prerrequisitos

- Node.js 16+
- PostgreSQL 12+
- Cuenta de Salesforce con Connected App configurada
- npm o yarn

## 🔧 Instalación

### 1. Clonar y configurar el proyecto

```bash
# Instalar dependencias del proyecto principal
npm run install-all
```

### 2. Configurar la base de datos PostgreSQL

```bash
# Crear base de datos
createdb lead_approval_db

# O usando psql
psql -U postgres -c "CREATE DATABASE lead_approval_db;"
```

### 3. Configurar variables de entorno

El archivo `.env` ya está configurado con tus credenciales de Salesforce:

```bash
# Navegar al directorio backend
cd backend

# Verificar el archivo .env (ya está configurado)
cat .env
```

### 4. Configurar Prisma y la base de datos

```bash
# Desde el directorio backend
cd backend

# Generar cliente de Prisma
npm run db:generate

# Aplicar esquema a la base de datos
npm run db:push
```

### 5. Iniciar la aplicación

```bash
# Desde el directorio raíz
npm run dev
```

Esto iniciará:
- Backend en: http://localhost:5000
- Frontend en: http://localhost:3000

## 🔑 Configuración de Salesforce

### Connected App ya configurada:
- **Consumer Key**: Ya está en el .env
- **Consumer Secret**: Ya está en el .env
- **Username**: rvidela9996@creative-moose-jv73ei.com
- **Password + Security Token**: Ya está en el .env

### Para verificar la conexión:
1. Inicia sesión como administrador
2. Ve al Panel de Administración
3. Verifica el estado "Salesforce Conectado" en la esquina superior derecha

## 👥 Uso del Sistema

### Para Administradores:

1. **Registrarse como Admin**:
   ```bash
   # Ir a: http://localhost:3000/register
   # Seleccionar rol: "Administrador"
   ```

2. **Aprobar/Rechazar Leads**:
   - Ve al Panel de Administración
   - Revisa leads pendientes
   - Aprueba (se envía automáticamente a Salesforce) o rechaza

### Para Usuarios Finales:

1. **Enviar Lead** (sin registro):
   ```bash
   # Ir a: http://localhost:3000/lead-form
   # Completar formulario
   ```

2. **Registrarse para seguimiento**:
   ```bash
   # Ir a: http://localhost:3000/register
   # Seleccionar rol: "Usuario"
   ```

## 🛠️ Scripts Disponibles

### Raíz del proyecto:
```bash
npm run dev          # Inicia frontend y backend
npm run install-all  # Instala todas las dependencias
```

### Backend (directorio /backend):
```bash
npm run dev         # Inicia servidor con nodemon
npm run start       # Inicia servidor en producción
npm run db:generate # Genera cliente Prisma
npm run db:push     # Aplica cambios al esquema
npm run db:studio   # Abre Prisma Studio
```

### Frontend (directorio /frontend):
```bash
npm start          # Inicia aplicación React
npm run build      # Construye para producción
npm test           # Ejecuta tests
```

## 📊 Base de Datos

### Modelos principales:

- **User**: Usuarios del sistema (admin/user)
- **Lead**: Leads enviados para aprobación
- **Notification**: Notificaciones en tiempo real

### Esquema completo en: `backend/prisma/schema.prisma`

## 🔗 API Endpoints

### Autenticación:
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Leads:
- `POST /api/leads` - Crear lead (público)
- `GET /api/leads/pending` - Leads pendientes (admin)
- `POST /api/leads/:id/approve` - Aprobar lead (admin)
- `POST /api/leads/:id/reject` - Rechazar lead (admin)

### Notificaciones:
- `GET /api/notifications` - Obtener notificaciones
- `PUT /api/notifications/:id/read` - Marcar como leída

## 🚀 Despliegue en Producción

### Variables de entorno para producción:
```bash
# Actualizar en .env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="un-secreto-muy-seguro-para-produccion"
NODE_ENV="production"
```

### Opciones recomendadas:
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, Heroku
- **Base de datos**: PostgreSQL en AWS RDS, Google Cloud SQL

## 🤝 Flujo de Trabajo

1. **Usuario envía lead** → Formulario público
2. **Sistema notifica admins** → Notificación en tiempo real
3. **Admin revisa lead** → Panel de administración
4. **Admin aprueba** → Lead se envía automáticamente a Salesforce
5. **Usuario recibe notificación** → Estado actualizado

## 🔧 Troubleshooting

### Problemas comunes:

1. **Error de conexión a Salesforce**:
   - Verificar credenciales en `.env`
   - Comprobar Security Token actualizado

2. **Error de base de datos**:
   - Verificar que PostgreSQL esté corriendo
   - Ejecutar `npm run db:push` en /backend

3. **Error de CORS**:
   - Verificar configuración en `backend/server.js`
   - Frontend debe correr en puerto 3000

4. **WebSockets no funcionan**:
   - Verificar que ambos puertos estén disponibles
   - Comprobar configuración de proxy en `frontend/package.json`

## 📝 Logs y Debugging

### Ver logs del backend:
```bash
cd backend
npm run dev
# Los logs aparecerán en la consola
```

### Debugging con Prisma Studio:
```bash
cd backend
npm run db:studio
# Abre interface web para ver/editar base de datos
```

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en la consola del backend
2. Verifica el estado de Salesforce en el panel admin
3. Comprueba que todas las variables de entorno estén configuradas
4. Asegúrate de que PostgreSQL esté corriendo

¡El sistema está listo para usar! 🎉