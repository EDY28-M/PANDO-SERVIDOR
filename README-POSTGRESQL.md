# Configuración de PostgreSQL para PANDO

Este documento te guía para configurar PostgreSQL como base de datos para el proyecto PANDO.

## 📋 Requisitos Previos

1. **PostgreSQL instalado** en tu sistema
2. **Node.js** versión 20 o superior
3. **npm** o **yarn** para gestionar dependencias

## 🐘 Instalación de PostgreSQL

### Windows
1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador y sigue las instrucciones
3. Anota la contraseña que configures para el usuario `postgres`
4. Asegúrate de que el servicio PostgreSQL esté ejecutándose

### macOS
```bash
# Con Homebrew
brew install postgresql
brew services start postgresql

# O descarga desde: https://www.postgresql.org/download/macosx/
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## ⚙️ Configuración del Proyecto

### 1. Crear archivo .env

Copia el archivo de ejemplo y configúralo:

```bash
cp config.env.example .env
```

### 2. Configurar variables de entorno

Edita el archivo `.env` con tus credenciales:

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
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar la base de datos

```bash
npm run setup-postgresql
```

Este comando:
- Probará la conexión a PostgreSQL
- Creará la base de datos `pando_db`
- Creará las tablas necesarias
- Configurará los índices para mejor rendimiento

## 🚀 Iniciar el Servidor

```bash
npm run dev
```

El servidor estará disponible en: http://localhost:3000

## 🧪 Probar la Configuración

### Probar conexión a la base de datos
```bash
npm run test-db
```

### Probar configuración de email
```bash
npm run test-config
```

### Probar envío de emails
```bash
npm run test-email
```

## 📊 Estructura de la Base de Datos

### Tabla: `contact_submissions`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | Clave primaria autoincremental |
| `name` | VARCHAR(100) | Nombre del contacto |
| `email` | VARCHAR(100) | Email del contacto |
| `subject` | VARCHAR(200) | Asunto del mensaje |
| `message` | TEXT | Contenido del mensaje |
| `ip_address` | VARCHAR(45) | Dirección IP del remitente |
| `user_agent` | TEXT | User agent del navegador |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |
| `status` | VARCHAR(20) | Estado del mensaje (new, read, replied, archived) |

### Índices Creados

- `idx_contact_email`: Para búsquedas por email
- `idx_contact_created_at`: Para ordenamiento por fecha
- `idx_contact_status`: Para filtros por estado

## 🔧 Comandos Útiles

### Desarrollo Local
```bash
# Iniciar servidor en modo desarrollo
npm run dev

# Configurar base de datos PostgreSQL
npm run setup-postgresql

# Probar conexión a la base de datos
npm run test-db
```

### Google Cloud Platform
```bash
# Crear instancia de Cloud SQL PostgreSQL
npm run cloud-sql:create

# Configurar base de datos en Cloud SQL
npm run cloud-sql:setup

# Conectar a Cloud SQL
npm run cloud-sql:connect

# Deploy a Google Cloud
npm run deploy
```

## 🛠️ Solución de Problemas

### Error: "connection refused"
- Verifica que PostgreSQL esté ejecutándose
- Comprueba que el puerto 5432 esté disponible
- Revisa las credenciales en el archivo `.env`

### Error: "password authentication failed"
- Verifica la contraseña del usuario `postgres`
- Asegúrate de que el usuario tenga permisos para crear bases de datos

### Error: "database does not exist"
- Ejecuta `npm run setup-postgresql` para crear la base de datos
- Verifica que el usuario tenga permisos de creación

### Error: "permission denied"
- Asegúrate de que el usuario `postgres` tenga permisos de superusuario
- Verifica la configuración de `pg_hba.conf`

## 📝 Notas Importantes

1. **Seguridad**: Nunca subas el archivo `.env` a Git
2. **Backup**: El sistema incluye respaldo en JSON si PostgreSQL no está disponible
3. **Email**: Configura una contraseña de aplicación de Gmail, no tu contraseña normal
4. **Puerto**: PostgreSQL usa el puerto 5432 por defecto

## 🔗 Enlaces Útiles

- [Documentación oficial de PostgreSQL](https://www.postgresql.org/docs/)
- [Node.js PostgreSQL driver](https://node-postgres.com/)
- [Google Cloud SQL PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Generar contraseña de aplicación Gmail](https://myaccount.google.com/apppasswords) 