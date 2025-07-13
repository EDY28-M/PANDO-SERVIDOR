# ✅ Configuración de PostgreSQL Completada

## 📋 Resumen de Cambios Realizados

He configurado completamente tu proyecto PANDO para usar PostgreSQL como base de datos. Aquí está todo lo que se ha configurado:

### 🔧 Archivos Creados/Modificados

1. **`config.env.example`** - Actualizado para PostgreSQL
2. **`setup-postgresql.js`** - Script de configuración local
3. **`test-postgresql-connection.js`** - Script de prueba de conexión
4. **`setup-gcp-postgresql.js`** - Script para Google Cloud
5. **`README-POSTGRESQL.md`** - Documentación completa
6. **`package.json`** - Scripts actualizados
7. **`config/postgres-database.js`** - Ya existía y está configurado

### 🚀 Comandos Disponibles

```bash
# Configuración local
npm run setup-postgresql          # Configurar PostgreSQL local
npm run test-postgresql           # Probar conexión PostgreSQL
npm run test-db                   # Probar conexión general

# Google Cloud
npm run setup-gcp-postgresql      # Configurar Cloud SQL PostgreSQL
npm run cloud-sql:create          # Crear instancia Cloud SQL
npm run cloud-sql:setup           # Configurar base de datos
npm run cloud-sql:connect         # Conectar a Cloud SQL

# Desarrollo
npm run dev                       # Iniciar servidor en desarrollo
npm run test-email                # Probar configuración de email
npm run test-config               # Probar configuración general
```

## 📝 Pasos para Configurar tu .env

### 1. Crear archivo .env
```bash
cp config.env.example .env
```

### 2. Configurar variables en .env
```env
# Configuración de PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu-contraseña-postgresql
DB_NAME=pando_db

# Configuración de Email (OBLIGATORIO)
GMAIL_USER=tu-email@gmail.com
GMAIL_PASS=tu-contraseña-de-aplicación

# Configuración del Servidor
NODE_ENV=development
PORT=3000

# Configuración de Seguridad
SESSION_SECRET=pando-secret-key-2024
```

## 🐘 Instalación de PostgreSQL

### Windows
1. Descarga desde: https://www.postgresql.org/download/windows/
2. Instala con la contraseña que configures para el usuario `postgres`
3. Asegúrate de que el servicio esté ejecutándose

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## ⚙️ Configuración Paso a Paso

### 1. Instalar PostgreSQL
Sigue las instrucciones de instalación para tu sistema operativo.

### 2. Crear archivo .env
```bash
cp config.env.example .env
```

### 3. Configurar credenciales
Edita el archivo `.env` con tu contraseña de PostgreSQL.

### 4. Instalar dependencias
```bash
npm install
```

### 5. Configurar base de datos
```bash
npm run setup-postgresql
```

### 6. Probar configuración
```bash
npm run test-postgresql
```

### 7. Iniciar servidor
```bash
npm run dev
```

## 🧪 Pruebas Disponibles

### Probar conexión a PostgreSQL
```bash
npm run test-postgresql
```

### Probar configuración de email
```bash
npm run test-config
```

### Probar envío de emails
```bash
npm run test-email
```

## 📊 Estructura de Base de Datos

### Tabla: `contact_submissions`
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(100))
- `email` (VARCHAR(100))
- `subject` (VARCHAR(200))
- `message` (TEXT)
- `ip_address` (VARCHAR(45))
- `user_agent` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `status` (VARCHAR(20))

### Índices Creados
- `idx_contact_email`
- `idx_contact_created_at`
- `idx_contact_status`

## ☁️ Google Cloud Platform

### Para usar PostgreSQL en Google Cloud:

1. **Configurar variables en .env:**
```env
GOOGLE_CLOUD_PROJECT=tu-proyecto-id
CLOUD_SQL_CONNECTION_NAME=proyecto:region:instancia
CLOUD_SQL_PUBLIC_IP=ip-pública-de-cloud-sql
```

2. **Crear instancia Cloud SQL:**
```bash
npm run cloud-sql:create
```

3. **Configurar base de datos:**
```bash
npm run setup-gcp-postgresql
```

4. **Deploy:**
```bash
npm run deploy
```

## 🛠️ Solución de Problemas

### Error: "connection refused"
- Verifica que PostgreSQL esté ejecutándose
- Comprueba el puerto 5432
- Revisa las credenciales en .env

### Error: "password authentication failed"
- Verifica la contraseña del usuario postgres
- Asegúrate de que el usuario tenga permisos

### Error: "database does not exist"
- Ejecuta `npm run setup-postgresql`
- Verifica permisos de creación

## 📚 Documentación Adicional

- **README-POSTGRESQL.md** - Guía completa de configuración
- **config/postgres-database.js** - Módulo de base de datos
- **setup-postgresql.js** - Script de configuración local
- **setup-gcp-postgresql.js** - Script para Google Cloud

## ✅ Estado Actual

- ✅ Soporte para PostgreSQL configurado
- ✅ Scripts de configuración creados
- ✅ Documentación completa
- ✅ Pruebas de conexión disponibles
- ✅ Soporte para Google Cloud SQL
- ✅ Sistema de respaldo en JSON

Tu proyecto está completamente configurado para usar PostgreSQL. Solo necesitas:

1. Instalar PostgreSQL en tu sistema
2. Crear el archivo `.env` con tus credenciales
3. Ejecutar `npm run setup-postgresql`
4. Iniciar con `npm run dev`

¡Todo listo para usar! 🎉 