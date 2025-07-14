// config/production-database.js
// Configuración específica para producción en Google Cloud SQL
const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🚀 Configuración de producción - Google Cloud SQL MySQL');

// Configuración para producción en Google Cloud
const productionConfig = {
    host: process.env.CLOUD_SQL_PUBLIC_IP || process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'pando_db',
    charset: 'utf8mb4',
    // Configuraciones optimizadas para Cloud SQL
    connectTimeout: 60000,
    acquireTimeout: 60000,
    reconnect: true,
    // Pool de conexiones para producción
    connectionLimit: 20,
    queueLimit: 0,
    // SSL para conexiones seguras
    ssl: {
        rejectUnauthorized: false
    }
};

// Crear pool de conexiones para producción
const productionPool = mysql.createPool(productionConfig);

// Función para probar la conexión en producción
async function testProductionConnection() {
    try {
        console.log('🔌 Probando conexión a Cloud SQL...');
        console.log(`   • Host: ${productionConfig.host}:${productionConfig.port}`);
        console.log(`   • Usuario: ${productionConfig.user}`);
        console.log(`   • Base de datos: ${productionConfig.database}`);
        
        const connection = await productionPool.getConnection();
        
        // Verificar que podemos hacer consultas
        const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
        console.log('✅ Conexión exitosa a Cloud SQL MySQL');
        console.log(`   • Timestamp del servidor: ${rows[0].timestamp}`);
        
        // Verificar la base de datos
        const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as version');
        console.log(`   • Base de datos activa: ${dbInfo[0].current_db}`);
        console.log(`   • Versión MySQL: ${dbInfo[0].version}`);
        
        connection.release();
        return true;
        
    } catch (error) {
        console.error('❌ Error de conexión a Cloud SQL:', error.message);
        return false;
    }
}

// Función para inicializar la base de datos en producción
async function initializeProductionDatabase() {
    try {
        console.log('🔧 Inicializando base de datos en producción...');
        
        const connection = await productionPool.getConnection();
        
        // Crear tablas si no existen
        const tables = [
            {
                name: 'contacts',
                sql: `
                CREATE TABLE IF NOT EXISTS contacts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    message TEXT NOT NULL,
                    service VARCHAR(100),
                    budget VARCHAR(50),
                    timeline VARCHAR(50),
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `
            },
            {
                name: 'site_config',
                sql: `
                CREATE TABLE IF NOT EXISTS site_config (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    config_key VARCHAR(100) UNIQUE NOT NULL,
                    config_value TEXT,
                    description VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_config_key (config_key)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `
            }
        ];
        
        for (const table of tables) {
            await connection.execute(table.sql);
            console.log(`✅ Tabla '${table.name}' verificada/creada`);
        }
        
        // Insertar configuración inicial si no existe
        const initialConfig = [
            ['site_name', 'PANDO', 'Nombre del sitio web'],
            ['admin_email', 'keraaigpt.plus@gmail.com', 'Email del administrador'],
            ['maintenance_mode', 'false', 'Modo de mantenimiento'],
            ['site_version', '1.0.0', 'Versión del sitio']
        ];
        
        for (const [key, value, description] of initialConfig) {
            await connection.execute(
                'INSERT IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)',
                [key, value, description]
            );
        }
        
        console.log('✅ Configuración inicial aplicada');
        
        connection.release();
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error.message);
        return false;
    }
}

// Función para obtener estadísticas de la base de datos
async function getDatabaseStats() {
    try {
        const connection = await productionPool.getConnection();
        
        // Contar registros en tablas principales
        const [contactsCount] = await connection.execute('SELECT COUNT(*) as count FROM contacts');
        const [configCount] = await connection.execute('SELECT COUNT(*) as count FROM site_config');
        
        console.log('📊 Estadísticas de la base de datos:');
        console.log(`   • Contactos: ${contactsCount[0].count}`);
        console.log(`   • Configuraciones: ${configCount[0].count}`);
        
        connection.release();
        
        return {
            contacts: contactsCount[0].count,
            config: configCount[0].count
        };
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error.message);
        return null;
    }
}

module.exports = {
    pool: productionPool,
    config: productionConfig,
    testConnection: testProductionConnection,
    initializeDatabase: initializeProductionDatabase,
    getDatabaseStats
};
