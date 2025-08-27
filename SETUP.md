# 🚀 Guía de Instalación Rápida

## Prerrequisitos
- Node.js 16+ instalado
- PostgreSQL 12+ corriendo
- Credenciales de Salesforce (ya configuradas)

## 📦 Instalación en 3 pasos

### 1. Instalar dependencias
```bash
npm run install-all
```

### 2. Configurar base de datos
```bash
# Crear base de datos PostgreSQL
createdb lead_approval_db

# Configurar Prisma y poblar base de datos con datos de ejemplo
cd backend
npm run setup
```

### 3. Iniciar aplicación
```bash
# Desde la carpeta raíz
npm run dev
```

## ✅ Verificar instalación

1. **Frontend**: http://localhost:3000
2. **Backend**: http://localhost:5000/api/health
3. **Base de datos**: `cd backend && npm run db:studio`

## 👤 Usuarios de prueba creados

- **Admin**: admin@leadmanager.com / admin123
- **Usuario**: user@leadmanager.com / user123

## 🎯 Flujo de prueba

1. Ve a http://localhost:3000/lead-form y envía un lead
2. Inicia sesión como admin: admin@leadmanager.com / admin123  
3. Ve al Panel de Administración y aprueba el lead
4. ¡El lead se enviará automáticamente a Salesforce!

## 🔧 Configuración de Salesforce

Las credenciales ya están configuradas en `backend/.env`:
- ✅ Consumer Key/Secret
- ✅ Username/Password/Token  
- ✅ Instance URL

## ❗ Problemas comunes

**Error de PostgreSQL**: 
```bash
# Verificar que PostgreSQL esté corriendo
pg_ctl status
# O
brew services start postgresql  # Mac
sudo service postgresql start   # Linux
```

**Error de permisos en Salesforce**:
- Verifica que el Security Token esté actualizado
- El usuario debe tener permisos para crear Leads

**Puerto ocupado**:
- Frontend usa puerto 3000
- Backend usa puerto 5000
- Cambiar en los archivos de configuración si es necesario

## 🎉 ¡Listo!

Tu sistema de aprobación de leads está funcionando completamente integrado con Salesforce.