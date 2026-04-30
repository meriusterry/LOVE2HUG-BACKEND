const { promisePool } = require('../config/database');

class Product {
    static async create(productData) {
        const { name, description, price, category, stock, product_image, image_type, badge, status } = productData;
        
        const [result] = await promisePool.execute(
            `INSERT INTO products (name, description, price, category, stock, product_image, image_type, badge, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                parseFloat(price),
                category || null,
                parseInt(stock),
                product_image || null,  // Binary image data
                image_type || null,      // MIME type
                badge || null,
                status || 'active'
            ]
        );
        return result.insertId;
    }

    static async findAll(filters = {}) {
        let query = 'SELECT id, name, description, price, category, stock, image_type, badge, status, rating, reviews_count, created_at, updated_at FROM products WHERE 1=1';
        const values = [];
        
        if (filters.category && filters.category !== 'all') {
            query += ' AND category = ?';
            values.push(filters.category);
        }
        
        if (filters.status) {
            query += ' AND status = ?';
            values.push(filters.status);
        }
        
        if (filters.search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            values.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await promisePool.execute(query, values);
        
        // Convert BLOB to base64 for JSON response
        const productsWithImages = await Promise.all(rows.map(async (row) => {
            const [imageRow] = await promisePool.execute('SELECT product_image, image_type FROM products WHERE id = ?', [row.id]);
            return {
                ...row,
                product_image: imageRow[0]?.product_image ? imageRow[0].product_image.toString('base64') : null,
                image_type: imageRow[0]?.image_type || null
            };
        }));
        
        return productsWithImages;
    }

    static async findById(id) {
        const [rows] = await promisePool.execute(
            'SELECT id, name, description, price, category, stock, image_type, badge, status, rating, reviews_count, created_at, updated_at FROM products WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) return null;
        
        const [imageRow] = await promisePool.execute('SELECT product_image, image_type FROM products WHERE id = ?', [id]);
        
        return {
            ...rows[0],
            product_image: imageRow[0]?.product_image ? imageRow[0].product_image.toString('base64') : null,
            image_type: imageRow[0]?.image_type || null
        };
    }

    static async update(id, updateData) {
        const fields = [];
        const values = [];
        
        const allowedFields = ['name', 'description', 'price', 'category', 'stock', 'product_image', 'image_type', 'badge', 'status'];
        
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        }
        
        if (fields.length === 0) return false;
        
        values.push(id);
        const [result] = await promisePool.execute(
            `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await promisePool.execute('DELETE FROM products WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Product;