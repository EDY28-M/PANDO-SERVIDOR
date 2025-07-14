const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: '34.31.155.251',
            port: 3306,
            user: 'root',
            password: 'Junior.28',
            database: 'pando_db'
        });
        
        console.log('✅ Conexión exitosa a la base de datos');
        
        // Probar una consulta
        const [rows] = await connection.execute('SELECT * FROM servicios LIMIT 5');
        console.log('📋 Servicios encontrados:', rows.length);
        
        await connection.end();
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

testConnection();