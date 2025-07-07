#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de conexión para MySQL
const dbConfig = {
    host: process.env.DB_HOST || '34.123.243.162',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Junior.28',
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    charset: 'utf8mb4'
};

const databaseName = process.env.DB_NAME || 'pando_db';

console.log('🗄️ CONFIGURACIÓN MYSQL PARA PANDO');
console.log('================================');
console.log(`📊 Host: ${dbConfig.host}`);
console.log(`📊 Port: ${dbConfig.port}`);
console.log(`📊 User: ${dbConfig.user}`);
console.log(`📊 Database: ${databaseName}`);
console.log(`📊 Connection: ${process.env.CLOUD_SQL_CONNECTION_NAME}\n`);

async function createDatabase() {
    let connection;
    try {
        console.log('🔌 Conectando al servidor MySQL...');
        
        // Conectar sin especificar la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa al servidor MySQL');

        // Crear la base de datos si no existe
        console.log(`🗄️ Creando base de datos: ${databaseName}...`);
        await connection.execute(
            `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` 
             CHARACTER SET utf8mb4 
             COLLATE utf8mb4_unicode_ci`
        );
        console.log('✅ Base de datos creada/verificada');

        // Cerrar conexión inicial y crear nueva con la base de datos especificada
        await connection.end();
        
        // Configuración con la base de datos específica
        const dbConfigWithDatabase = {
            ...dbConfig,
            database: databaseName
        };
        
        console.log(`✅ Reconectando a la base de datos: ${databaseName}...`);
        connection = await mysql.createConnection(dbConfigWithDatabase);

        // Crear tabla para contactos
        console.log('📋 Creando tabla contact_submissions...');
        const createContactsTable = `
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                subject VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
                
                -- Índices para optimización
                INDEX idx_email (email),
                INDEX idx_created_at (created_at),
                INDEX idx_status (status),
                INDEX idx_name (name),
                INDEX idx_status_created (status, created_at)
            ) ENGINE=InnoDB 
            DEFAULT CHARSET=utf8mb4 
            COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(createContactsTable);
        console.log('✅ Tabla contact_submissions creada/verificada');

        // Insertar datos de ejemplo
        console.log('📝 Insertando datos de ejemplo...');
        const insertExampleData = `
            INSERT IGNORE INTO contact_submissions (name, email, subject, message, ip_address, status) VALUES
            ('Juan Pérez', 'juan@ejemplo.com', 'Consulta sobre servicios', 'Hola, me interesa conocer más sobre sus servicios de desarrollo web.', '192.168.1.100', 'new'),
            ('María González', 'maria@ejemplo.com', 'Solicitud de cotización', 'Necesito una cotización para el desarrollo de una aplicación móvil.', '192.168.1.101', 'read'),
            ('Carlos Rodríguez', 'carlos@ejemplo.com', 'Soporte técnico', 'Tengo problemas con la implementación de la API.', '192.168.1.102', 'replied'),
            ('Ana Martínez', 'ana@ejemplo.com', 'Feedback del proyecto', 'Quiero felicitarlos por el excelente trabajo realizado.', '192.168.1.103', 'archived')
        `;
        
        await connection.execute(insertExampleData);
        console.log('✅ Datos de ejemplo insertados');

        // Verificar la configuración
        console.log('\n📊 VERIFICANDO CONFIGURACIÓN...');
        
        // Mostrar estructura de la tabla
        const [tableInfo] = await connection.execute('DESCRIBE contact_submissions');
        console.log('\n📋 Estructura de la tabla contact_submissions:');
        console.table(tableInfo);

        // Mostrar estadísticas
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_contactos,
                COUNT(CASE WHEN status = 'new' THEN 1 END) as nuevos,
                COUNT(CASE WHEN status = 'read' THEN 1 END) as leidos,
                COUNT(CASE WHEN status = 'replied' THEN 1 END) as respondidos,
                COUNT(CASE WHEN status = 'archived' THEN 1 END) as archivados
            FROM contact_submissions
        `);
        
        console.log('\n📈 Estadísticas de la base de datos:');
        console.table(stats);

        // Mostrar últimos contactos
        const [contacts] = await connection.execute(`
            SELECT id, name, email, subject, status, created_at 
            FROM contact_submissions 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.log('\n📮 Últimos contactos:');
        console.table(contacts);

        console.log('\n🎉 ¡BASE DE DATOS MYSQL CONFIGURADA EXITOSAMENTE!');
        console.log('✅ Base de datos: pando_db');
        console.log('✅ Tabla: contact_submissions');
        console.log('✅ Datos de ejemplo insertados');
        console.log('✅ Índices optimizados');
        console.log('\n🚀 Tu aplicación PANDO está lista para funcionar con MySQL!');

    } catch (error) {
        console.error('❌ Error configurando la base de datos:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n🔧 Soluciones posibles:');
            console.error('1. Verificar que la instancia Cloud SQL esté activa');
            console.error('2. Verificar la IP autorizada en Cloud SQL');
            console.error('3. Verificar las credenciales de conexión');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n🔧 Error de credenciales:');
            console.error('1. Verificar usuario y contraseña');
            console.error('2. Verificar permisos del usuario en Cloud SQL');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar la configuración
if (require.main === module) {
    createDatabase().catch(console.error);
}

module.exports = { createDatabase };
