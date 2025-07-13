#!/usr/bin/env node

/**
 * Script de prueba para verificar la conexión a PostgreSQL
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🧪 Probando conexión a PostgreSQL...\n');

// Configuración de conexión
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pando_db'
};

console.log('📋 Configuración actual:');
console.log(`   • Host: ${config.host}:${config.port}`);
console.log(`   • Usuario: ${config.user}`);
console.log(`   • Base de datos: ${config.database}`);
console.log(`   • Contraseña: ${config.password ? '*** Configurada ***' : '❌ NO CONFIGURADA'}\n`);

async function testConnection() {
    try {
        console.log('🔌 Intentando conectar a PostgreSQL...');
        
        // Probar conexión sin especificar base de datos
        const tempConfig = { ...config };
        delete tempConfig.database;
        
        const pool = new Pool(tempConfig);
        const client = await pool.connect();
        
        console.log('✅ Conexión exitosa al servidor PostgreSQL');
        
        // Probar consulta simple
        const result = await client.query('SELECT version()');
        console.log('✅ Consulta de prueba exitosa');
        console.log(`   • Versión PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
        
        client.release();
        await pool.end();
        
        // Probar conexión a la base de datos específica
        console.log('\n🔌 Probando conexión a la base de datos...');
        const dbPool = new Pool(config);
        const dbClient = await dbPool.connect();
        
        // Verificar si la tabla existe
        const tableCheck = await dbClient.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'contact_submissions'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ Base de datos y tabla contact_submissions encontradas');
            
            // Contar registros
            const countResult = await dbClient.query('SELECT COUNT(*) FROM contact_submissions');
            console.log(`   • Registros en la tabla: ${countResult.rows[0].count}`);
        } else {
            console.log('⚠️ Base de datos encontrada pero la tabla contact_submissions no existe');
            console.log('💡 Ejecuta: npm run setup-postgresql para crear las tablas');
        }
        
        dbClient.release();
        await dbPool.end();
        
        console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
        console.log('✅ PostgreSQL está configurado correctamente');
        
    } catch (error) {
        console.error('\n❌ Error durante la prueba:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Soluciones posibles:');
            console.log('   1. Verifica que PostgreSQL esté ejecutándose');
            console.log('   2. Comprueba que el puerto 5432 esté disponible');
            console.log('   3. Revisa las credenciales en el archivo .env');
        } else if (error.code === '28P01') {
            console.log('\n💡 Error de autenticación:');
            console.log('   1. Verifica la contraseña del usuario postgres');
            console.log('   2. Asegúrate de que el usuario tenga permisos');
        } else if (error.code === '3D000') {
            console.log('\n💡 Base de datos no encontrada:');
            console.log('   1. Ejecuta: npm run setup-postgresql para crear la base de datos');
        }
        
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testConnection().catch(error => {
        console.error('❌ Error inesperado:', error.message);
        process.exit(1);
    });
}

module.exports = { testConnection }; 