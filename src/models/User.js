const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Helper function to convert undefined to null for SQL
const sanitizeValue = (value) => {
    return value !== undefined && value !== '' ? value : null;
};

class User {
    static async create(userData) {
        const { name, email, password, phone, address, city, province, postal_code } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await promisePool.execute(
            'INSERT INTO users (name, email, password, phone, address, city, province, postal_code, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name,
                email,
                hashedPassword,
                sanitizeValue(phone),
                sanitizeValue(address),
                sanitizeValue(city),
                sanitizeValue(province),
                sanitizeValue(postal_code),
                'user'
            ]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await promisePool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await promisePool.execute(
            'SELECT id, name, email, phone, address, city, province, postal_code, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, updateData) {
        const fields = [];
        const values = [];
        
        const allowedFields = ['name', 'phone', 'address', 'city', 'province', 'postal_code'];
        
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = ?`);
                // Convert empty strings to null for optional fields
                values.push(sanitizeValue(updateData[key]));
            }
        }
        
        if (fields.length === 0) return false;
        
        values.push(id);
        const [result] = await promisePool.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    }

    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await promisePool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async getAll(filters = {}) {
        let query = 'SELECT id, name, email, phone, address, city, province, postal_code, role, created_at FROM users';
        const values = [];
        
        if (filters.role) {
            query += ' WHERE role = ?';
            values.push(filters.role);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await promisePool.execute(query, values);
        return rows;
    }

    static async delete(id) {
        const [result] = await promisePool.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;