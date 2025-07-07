#!/usr/bin/env node

// setup-new-database.js
// Script para conectar y configurar la nueva base de datos de PANDO

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🚀 Iniciando configuración de nueva base de datos PANDO...\n');

// Configuración de conexión con los nuevos datos
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

console.log('📊 Configuración de conexión:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Database: ${databaseName}`);
console.log(`   Connection: ${process.env.CLOUD_SQL_CONNECTION_NAME}\n`);

async function createDatabase() {
    let connection;
    try {
        console.log('🔌 Conectando al servidor MySQL...');
        
        // Conectar sin especificar la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa al servidor MySQL');

        // Crear la base de datos si no existe
        console.log(`🗄️ Creando base de datos '${databaseName}'...`);
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Base de datos '${databaseName}' creada/verificada`);

        // Seleccionar la base de datos
        console.log(`✅ Base de datos configurada para '${databaseName}'`);

        // Cerrar conexión inicial y crear nueva con la base de datos especificada
        await connection.end();
        
        // Crear nueva conexión con la base de datos especificada
        const dbConfigWithDB = { ...dbConfig, database: databaseName };
        connection = await mysql.createConnection(dbConfigWithDB);
        console.log(`✅ Usando base de datos '${databaseName}'`);

        return connection;
    } catch (error) {
        console.error('❌ Error al crear la base de datos:', error.message);
        if (connection) await connection.end();
        throw error;
    }
}

async function createTables(connection) {
    try {
        console.log('📋 Creando tabla contact_submissions...');
        
        const createContactsTable = `
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                subject VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
                
                -- ÍNDICES PARA OPTIMIZACIÓN
                INDEX idx_email (email),
                INDEX idx_created_at (created_at),
                INDEX idx_status (status),
                INDEX idx_name (name),
                INDEX idx_status_created (status, created_at)
            ) ENGINE=InnoDB 
            DEFAULT CHARSET=utf8mb4 
            COLLATE=utf8mb4_unicode_ci
            COMMENT='Tabla para almacenar contactos del formulario de PANDO';
        `;
        
        await connection.execute(createContactsTable);
        console.log('✅ Tabla contact_submissions creada/verificada');

        // Verificar la estructura de la tabla
        const [columns] = await connection.execute(`DESCRIBE contact_submissions`);
        console.log('\n📊 Estructura de la tabla contact_submissions:');
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
        });

    } catch (error) {
        console.error('❌ Error al crear tablas:', error.message);
        throw error;
    }
}

async function insertTestData(connection) {
    try {
        console.log('\n🧪 Insertando datos de prueba...');
        
        // Verificar si ya hay datos
        const [existingData] = await connection.execute('SELECT COUNT(*) as count FROM contact_submissions');
        if (existingData[0].count > 0) {
            console.log(`ℹ️ Ya existen ${existingData[0].count} registros en la tabla`);
            return;
        }

        const testContacts = [
            {
                name: 'Juan Pérez',
                email: 'juan@ejemplo.com',
                subject: 'Consulta sobre servicios web',
                message: 'Hola, estoy interesado en conocer más sobre sus servicios de desarrollo web.',
                ip_address: '192.168.1.100',
                status: 'new'
            },
            {
                name: 'María González',
                email: 'maria@ejemplo.com',
                subject: 'Solicitud de cotización',
                message: 'Necesito una cotización para el desarrollo de una aplicación móvil.',
                ip_address: '192.168.1.101',
                status: 'read'
            },
            {
                name: 'Carlos Rodríguez',
                email: 'carlos@ejemplo.com',
                subject: 'Soporte técnico',
                message: 'Tengo algunas dudas sobre la implementación de la API.',
                ip_address: '192.168.1.102',
                status: 'replied'
            }
        ];

        const insertQuery = `
            INSERT INTO contact_submissions (name, email, subject, message, ip_address, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        for (const contact of testContacts) {
            await connection.execute(insertQuery, [
                contact.name,
                contact.email,
                contact.subject,
                contact.message,
                contact.ip_address,
                contact.status
            ]);
        }

        console.log(`✅ ${testContacts.length} contactos de prueba insertados`);

    } catch (error) {
        console.error('❌ Error al insertar datos de prueba:', error.message);
        throw error;
    }
}

async function verifyConfiguration(connection) {
    try {
        console.log('\n🔍 Verificando configuración...');

        // Verificar configuración de la base de datos
        const [dbInfo] = await connection.execute(`
            SELECT 
                @@character_set_database as charset,
                @@collation_database as collation,
                DATABASE() as current_db
        `);
        
        console.log('📊 Configuración de la base de datos:');
        console.log(`   Base de datos actual: ${dbInfo[0].current_db}`);
        console.log(`   Charset: ${dbInfo[0].charset}`);
        console.log(`   Collation: ${dbInfo[0].collation}`);

        // Obtener estadísticas
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_contactos,
                COUNT(CASE WHEN status = 'new' THEN 1 END) as nuevos,
                COUNT(CASE WHEN status = 'read' THEN 1 END) as leidos,
                COUNT(CASE WHEN status = 'replied' THEN 1 END) as respondidos,
                COUNT(CASE WHEN status = 'archived' THEN 1 END) as archivados
            FROM contact_submissions
        `);

        console.log('\n📈 Estadísticas actuales:');
        console.log(`   Total contactos: ${stats[0].total_contactos}`);
        console.log(`   Nuevos: ${stats[0].nuevos}`);
        console.log(`   Leídos: ${stats[0].leidos}`);
        console.log(`   Respondidos: ${stats[0].respondidos}`);
        console.log(`   Archivados: ${stats[0].archivados}`);

        // Mostrar últimos contactos
        const [recent] = await connection.execute(`
            SELECT id, name, email, subject, status, created_at
            FROM contact_submissions
            ORDER BY created_at DESC
            LIMIT 5
        `);

        if (recent.length > 0) {
            console.log('\n📋 Últimos contactos:');
            recent.forEach(contact => {
                console.log(`   ${contact.id}: ${contact.name} (${contact.email}) - ${contact.status}`);
            });
        }

    } catch (error) {
        console.error('❌ Error al verificar configuración:', error.message);
        throw error;
    }
}

async function testApplicationConnection() {
    try {
        console.log('\n🧪 Probando conexión desde la aplicación...');
        
        // Importar y probar el módulo gcp-database
        const database = require('./config/gcp-database');
        
        console.log('📊 Inicializando base de datos desde aplicación...');
        await database.initializeDatabase();
        
        console.log('📊 Probando inserción de contacto...');
        const testContact = {
            name: 'Test Aplicación',
            email: 'test@pando.com',
            subject: 'Prueba de conexión',
            message: 'Este es un mensaje de prueba desde la aplicación PANDO.',
            ip_address: '127.0.0.1',
            user_agent: 'PANDO Test Suite'
        };

        const result = await database.insertContact(testContact);
        if (result.success) {
            console.log(`✅ Contacto de prueba insertado con ID: ${result.id}`);
            
            // Obtener estadísticas
            const stats = await database.getContactStats();
            if (stats.success) {
                console.log('✅ Estadísticas obtenidas correctamente');
                console.log(`   Total: ${stats.stats.total}`);
                console.log(`   Nuevos: ${stats.stats.new_contacts}`);
            }
        } else {
            console.error('❌ Error al insertar contacto de prueba:', result.error);
        }

    } catch (error) {
        console.error('❌ Error al probar conexión de aplicación:', error.message);
    }
}

async function main() {
    let connection;
    
    try {
        console.log('🚀 CONFIGURACIÓN DE BASE DE DATOS PANDO\n');
        console.log('==================================================\n');

        // Paso 1: Crear base de datos
        connection = await createDatabase();

        // Paso 2: Crear tablas
        await createTables(connection);

        // Paso 3: Insertar datos de prueba
        await insertTestData(connection);

        // Paso 4: Verificar configuración
        await verifyConfiguration(connection);

        console.log('\n==================================================');
        console.log('✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
        console.log('==================================================\n');

        // Paso 5: Probar conexión de aplicación
        await testApplicationConnection();

        console.log('\n🎉 ¡Base de datos PANDO lista para producción!');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Ejecutar: npm start');
        console.log('   2. Abrir: http://localhost:3000');
        console.log('   3. Probar formulario de contacto');
        console.log('   4. Verificar admin panel: /admin.html\n');

    } catch (error) {
        console.error('\n❌ ERROR EN LA CONFIGURACIÓN:');
        console.error(error.message);
        console.error('\n💡 Posibles soluciones:');
        console.error('   1. Verificar credenciales en .env');
        console.error('   2. Confirmar que MySQL esté ejecutándose');
        console.error('   3. Verificar conectividad de red');
        console.error('   4. Revisar permisos de usuario de MySQL\n');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, createDatabase, createTables };
