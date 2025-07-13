#!/usr/bin/env node

/**
 * Script de configuración para PostgreSQL
 * Configura la base de datos PostgreSQL para el proyecto PANDO
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🐘 Configurando PostgreSQL para PANDO...\n');

// Configuración de conexión
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pando_db'
};

// Función para probar conexión
async function testConnection() {
    try {
        // Intentar conectar sin especificar base de datos
        const tempConfig = { ...config };
        delete tempConfig.database;
        
        const pool = new Pool(tempConfig);
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        await pool.end();
        
        console.log('✅ Conexión exitosa a PostgreSQL');
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con PostgreSQL:', error.message);
        console.log('\n💡 Verifica que:');
        console.log('   1. PostgreSQL esté instalado y ejecutándose');
        console.log('   2. Las credenciales en .env sean correctas');
        console.log('   3. El usuario tenga permisos para crear bases de datos');
        return false;
    }
}

// Función para crear la base de datos
async function createDatabase() {
    try {
        const tempConfig = { ...config };
        delete tempConfig.database;
        
        const pool = new Pool(tempConfig);
        const client = await pool.connect();
        
        // Crear la base de datos si no existe
        await client.query(`CREATE DATABASE ${config.database}`);
        console.log(`✅ Base de datos '${config.database}' creada exitosamente`);
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        if (error.code === '42P04') {
            console.log(`ℹ️ La base de datos '${config.database}' ya existe`);
            return true;
        } else {
            console.error('❌ Error al crear la base de datos:', error.message);
            return false;
        }
    }
}

// Función para crear las tablas
async function createTables() {
    try {
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
        console.log('✅ Tabla contact_submissions creada exitosamente');
        
        // Crear índices para mejor rendimiento
        const createIndexes = `
            CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email);
            CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_submissions(created_at);
            CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
        `;
        
        await client.query(createIndexes);
        console.log('✅ Índices creados exitosamente');
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.error('❌ Error al crear las tablas:', error.message);
        return false;
    }
}

// Función principal
async function setupPostgreSQL() {
    console.log('🔧 Iniciando configuración de PostgreSQL...\n');
    
    // Verificar variables de entorno
    if (!process.env.DB_PASSWORD) {
        console.error('❌ Error: DB_PASSWORD no está configurado en .env');
        console.log('💡 Configura tu contraseña de PostgreSQL en el archivo .env');
        process.exit(1);
    }
    
    // Probar conexión
    const connected = await testConnection();
    if (!connected) {
        console.log('\n❌ No se pudo conectar a PostgreSQL');
        console.log('💡 Asegúrate de que PostgreSQL esté instalado y ejecutándose');
        process.exit(1);
    }
    
    // Crear base de datos
    const dbCreated = await createDatabase();
    if (!dbCreated) {
        console.log('\n❌ No se pudo crear la base de datos');
        process.exit(1);
    }
    
    // Crear tablas
    const tablesCreated = await createTables();
    if (!tablesCreated) {
        console.log('\n❌ No se pudieron crear las tablas');
        process.exit(1);
    }
    
    console.log('\n🎉 ¡Configuración de PostgreSQL completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   • Host: ${config.host}:${config.port}`);
    console.log(`   • Base de datos: ${config.database}`);
    console.log(`   • Usuario: ${config.user}`);
    console.log('\n🚀 Puedes iniciar el servidor con: npm run dev');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    setupPostgreSQL().catch(error => {
        console.error('❌ Error durante la configuración:', error.message);
        process.exit(1);
    });
}

module.exports = { setupPostgreSQL, testConnection, createDatabase, createTables }; 