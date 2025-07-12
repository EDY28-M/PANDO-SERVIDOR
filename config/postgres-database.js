// config/postgres-database.js
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🗄️ Configuración PostgreSQL:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'pando_db'
});

const backupDir = path.join(__dirname, '..', 'temp-download');
const contactsFile = path.join(backupDir, 'contacts.json');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pando_db'
});

let dbAvailable = false;

async function testConnection() {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ Conexión exitosa a PostgreSQL');
        dbAvailable = true;
        return true;
    } catch (err) {
        console.error('❌ Error al conectar con PostgreSQL:', err.message);
        dbAvailable = false;
        return false;
    }
}

async function createTables() {
    const query = `
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

    const client = await pool.connect();
    await client.query(query);
    client.release();
    console.log('✅ Tabla contact_submissions lista');
}

async function initializeDatabase() {
    const connected = await testConnection();
    if (connected) {
        await createTables();
    }
    return connected;
}

async function saveContact(data) {
    if (!dbAvailable) return saveContactToFile(data);
    const query = `INSERT INTO contact_submissions (name, email, subject, message, ip_address, user_agent)
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
    try {
        const client = await pool.connect();
        const res = await client.query(query, [
            data.name,
            data.email,
            data.subject,
            data.message,
            data.ip_address || null,
            data.user_agent || null
        ]);
        client.release();
        return { success: true, id: res.rows[0].id };
    } catch (err) {
        console.error('❌ Error al guardar contacto:', err.message);
        return saveContactToFile(data);
    }
}

async function getContacts({ limit = 50, offset = 0 } = {}) {
    if (!dbAvailable) return getContactsFromFile({ limit, offset });
    const client = await pool.connect();
    const res = await client.query(
        'SELECT id, name, email, subject, message, created_at, status FROM contact_submissions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
    );
    client.release();
    return { success: true, data: res.rows };
}

async function getContactStats() {
    if (!dbAvailable) return getStatsFromFile();
    const client = await pool.connect();
    const res = await client.query(
        `SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'new') AS new_contacts,
            COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS today_contacts,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS week_contacts
        FROM contact_submissions`
    );
    client.release();
    return { success: true, stats: res.rows[0] };
}

async function updateContactStatus(id, status) {
    if (!dbAvailable) return { success: false, message: 'DB not available' };
    const client = await pool.connect();
    const res = await client.query(
        'UPDATE contact_submissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, id]
    );
    client.release();
    return { success: true, affectedRows: res.rowCount };
}

async function deleteContact(id) {
    if (!dbAvailable) return { success: false, message: 'DB not available' };
    const client = await pool.connect();
    const res = await client.query('DELETE FROM contact_submissions WHERE id = $1', [id]);
    client.release();
    return { success: true, affectedRows: res.rowCount };
}

async function cleanupOldContacts(days = 90) {
    if (!dbAvailable) return { success: false, message: 'DB not available' };
    const client = await pool.connect();
    const res = await client.query(
        'DELETE FROM contact_submissions WHERE created_at < NOW() - INTERVAL $1 DAY AND status IN (\'archived\', \'read\')',
        [days]
    );
    client.release();
    return { success: true, deletedCount: res.rowCount };
}

// Fallback JSON functions
async function saveContactToFile(contactData) {
    try {
        await fs.mkdir(backupDir, { recursive: true });
        let contacts = [];
        try {
            const data = await fs.readFile(contactsFile, 'utf8');
            contacts = JSON.parse(data);
        } catch (e) {}
        const contact = { id: Date.now(), ...contactData, created_at: new Date().toISOString(), status: 'new' };
        contacts.push(contact);
        await fs.writeFile(contactsFile, JSON.stringify(contacts, null, 2));
        return { success: true, id: contact.id };
    } catch (e) {
        return { success: false, message: e.message };
    }
}

async function getContactsFromFile({ limit = 50, offset = 0 } = {}) {
    try {
        const data = await fs.readFile(contactsFile, 'utf8');
        const contacts = JSON.parse(data).slice(offset, offset + limit);
        return { success: true, data: contacts };
    } catch (e) {
        return { success: true, data: [] };
    }
}

async function getStatsFromFile() {
    try {
        const data = await fs.readFile(contactsFile, 'utf8');
        const contacts = JSON.parse(data);
        const total = contacts.length;
        const newContacts = contacts.filter(c => c.status === 'new').length;
        const today = new Date().toDateString();
        const todayContacts = contacts.filter(c => new Date(c.created_at).toDateString() === today).length;
        const weekContacts = contacts.filter(c => new Date(c.created_at) >= Date.now() - 7 * 24 * 60 * 60 * 1000).length;
        return { success: true, stats: { total, new_contacts: newContacts, today_contacts: todayContacts, week_contacts: weekContacts } };
    } catch (e) {
        return { success: true, stats: { total: 0, new_contacts: 0, today_contacts: 0, week_contacts: 0 } };
    }
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase,
    saveContact,
    getContacts,
    getContactStats,
    updateContactStatus,
    deleteContact,
    cleanupOldContacts,
    isAvailable: () => dbAvailable
};
