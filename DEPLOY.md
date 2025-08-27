# 🚀 Deploy Guide - Lead Management System

## 📁 Estructura para Deploy

```
lead-management/
├── backend/              # 🔴 Deploy en Railway/Render
│   ├── simple-server.js  # Servidor principal
│   ├── package.json      # Dependencies
│   └── .env.example     # Template variables
├── frontend/             # 🔵 Deploy en Vercel
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## 🔧 Variables de Entorno

### Backend (Railway/Render):
```bash
# Salesforce
SALESFORCE_CLIENT_ID=3MVG9XgkMlifdwVA...
SALESFORCE_CLIENT_SECRET=tu_client_secret
SALESFORCE_REFRESH_TOKEN=5Aep861JXR2zRHPQHL7iy1sr...

# Database (cuando implementes PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Server
PORT=4001
NODE_ENV=production
```

### Frontend (Vercel):
```bash
REACT_APP_API_URL=https://tu-backend.railway.app/api
```

## 🌐 Pasos de Deploy

### 1. Preparar GitHub
```bash
# Crear repo en GitHub
git init
git add .
git commit -m "Initial commit - Lead Management System"
git remote add origin https://github.com/tu-usuario/lead-management.git
git push -u origin main
```

### 2. Backend (Railway/Render)
1. **Crear Web Service**
2. **Connect GitHub** → Tu repo
3. **Root Directory**: `/backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Agregar variables de entorno**

### 3. Frontend (Vercel)
1. **Import Project** desde GitHub
2. **Root Directory**: `/frontend`  
3. **Framework**: React
4. **Agregar**: `REACT_APP_API_URL`

### 4. Database (Neon/Supabase)
1. **Crear PostgreSQL Database**
2. **Copiar CONNECTION_STRING**
3. **Agregar a Backend**: `DATABASE_URL`

## 🔄 Auto-Deploy
- **Push a GitHub** = Deploy automático
- **Logs en tiempo real**
- **SSL automático**

## ✅ URLs Finales
- **Frontend**: `https://tu-app.vercel.app`
- **Backend**: `https://tu-api.railway.app`
- **Database**: Interno (no público)

## 🧪 Testing en Producción
```bash
# Test API
curl https://tu-api.railway.app/api/health

# Test Login
curl -X POST https://tu-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@leadmanager.com","password":"user123"}'
```