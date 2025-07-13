#!/usr/bin/env node

/**
 * Script de configuración para PostgreSQL en Google Cloud Platform
 * Configura Cloud SQL PostgreSQL para el proyecto PANDO
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('☁️ Configurando PostgreSQL en Google Cloud Platform...\n');

// Verificar variables de entorno requeridas
const requiredEnvVars = [
    'GOOGLE_CLOUD_PROJECT',
    'CLOUD_SQL_CONNECTION_NAME',
    'DB_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => {
        console.error(`   • ${varName}`);
    });
    console.log('\n💡 Configura estas variables en tu archivo .env');
    process.exit(1);
}

// Configuración de conexión
const config = {
    host: process.env.CLOUD_SQL_PUBLIC_IP || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'pando_db',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('📋 Configuración de Google Cloud:');
console.log(`   • Proyecto: ${process.env.GOOGLE_CLOUD_PROJECT}`);
console.log(`   • Conexión: ${process.env.CLOUD_SQL_CONNECTION_NAME}`);
console.log(`   • Host: ${config.host}:${config.port}`);
console.log(`   • Base de datos: ${config.database}\n`);

async function testCloudConnection() {
    try {
        console.log('🔌 Probando conexión a Cloud SQL PostgreSQL...');
        
        const pool = new Pool(config);
        const client = await pool.connect();
        
        // Probar consulta simple
        const result = await client.query('SELECT version()');
        console.log('✅ Conexión exitosa a Cloud SQL PostgreSQL');
        console.log(`   • Versión: ${result.rows[0].version.split(' ')[0]}`);
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con Cloud SQL:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Posibles soluciones:');
            console.log('   1. Verifica que la instancia de Cloud SQL esté ejecutándose');
            console.log('   2. Comprueba que la IP pública esté configurada correctamente');
            console.log('   3. Asegúrate de que las reglas de firewall permitan la conexión');
        } else if (error.code === '28P01') {
            console.log('\n💡 Error de autenticación:');
            console.log('   1. Verifica la contraseña del usuario postgres');
            console.log('   2. Asegúrate de que el usuario tenga permisos');
        }
        
        return false;
    }
}

async function createCloudDatabase() {
    try {
        console.log('🗄️ Creando base de datos en Cloud SQL...');
        
        // Conectar sin especificar base de datos
        const tempConfig = { ...config };
        delete tempConfig.database;
        
        const pool = new Pool(tempConfig);
        const client = await pool.connect();
        
        // Crear la base de datos
        await client.query(`CREATE DATABASE ${config.database}`);
        console.log(`✅ Base de datos '${config.database}' creada en Cloud SQL`);
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        if (error.code === '42P04') {
            console.log(`ℹ️ La base de datos '${config.database}' ya existe en Cloud SQL`);
            return true;
        } else {
            console.error('❌ Error al crear la base de datos:', error.message);
            return false;
        }
    }
}

async function createCloudTables() {
    try {
        console.log('📋 Creando tablas en Cloud SQL...');
        
        const pool = new Pool(config);
        const client = await pool.connect();
        
        // Crear tabla para contactos
        const createContactsTable = `
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                subject VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'new'
            );
        `;
        
        await client.query(createContactsTable);
        console.log('✅ Tabla contact_submissions creada en Cloud SQL');
        
        // Crear índices para mejor rendimiento
        const createIndexes = `
            CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email);
            CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_submissions(created_at);
            CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
        `;
        
        await client.query(createIndexes);
        console.log('✅ Índices creados en Cloud SQL');
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.error('❌ Error al crear las tablas:', error.message);
        return false;
    }
}

async function setupCloudPostgreSQL() {
    console.log('🔧 Iniciando configuración de Cloud SQL PostgreSQL...\n');
    
    // Probar conexión
    const connected = await testCloudConnection();
    if (!connected) {
        console.log('\n❌ No se pudo conectar a Cloud SQL PostgreSQL');
        process.exit(1);
    }
    
    // Crear base de datos
    const dbCreated = await createCloudDatabase();
    if (!dbCreated) {
        console.log('\n❌ No se pudo crear la base de datos en Cloud SQL');
        process.exit(1);
    }
    
    // Crear tablas
    const tablesCreated = await createCloudTables();
    if (!tablesCreated) {
        console.log('\n❌ No se pudieron crear las tablas en Cloud SQL');
        process.exit(1);
    }
    
    console.log('\n🎉 ¡Configuración de Cloud SQL PostgreSQL completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   • Proyecto: ${process.env.GOOGLE_CLOUD_PROJECT}`);
    console.log(`   • Instancia: ${process.env.CLOUD_SQL_CONNECTION_NAME}`);
    console.log(`   • Base de datos: ${config.database}`);
    console.log(`   • Host: ${config.host}:${config.port}`);
    console.log('\n🚀 Puedes hacer deploy con: npm run deploy');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    setupCloudPostgreSQL().catch(error => {
        console.error('❌ Error durante la configuración:', error.message);
        process.exit(1);
    });
}

module.exports = { 
    setupCloudPostgreSQL, 
    testCloudConnection, 
    createCloudDatabase, 
    createCloudTables 
}; 