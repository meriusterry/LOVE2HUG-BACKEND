const { promisePool } = require('../config/database');

// Helper function to convert undefined to null
const sanitizeValue = (value) => {
    return value !== undefined && value !== '' ? value : null;
};

class Order {
    static async create(orderData, items) {
        const connection = await promisePool.getConnection();
        try {
            await connection.beginTransaction();
            
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, 
                 shipping_address, city, province, postal_code, subtotal, shipping_cost, tax, total, status, payment_method, payment_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderData.order_number, 
                    orderData.user_id || null,
                    orderData.customer_name,
                    orderData.customer_email,
                    sanitizeValue(orderData.customer_phone),
                    orderData.shipping_address,
                    sanitizeValue(orderData.city),
                    sanitizeValue(orderData.province),
                    sanitizeValue(orderData.postal_code),
                    orderData.subtotal,
                    orderData.shipping_cost || 0,
                    orderData.tax || 0,
                    orderData.total,
                    orderData.status || 'pending',
                    orderData.payment_method,
                    orderData.payment_status || 'pending'
                ]
            );
            
            const orderId = orderResult.insertId;
            
            for (const item of items) {
                // FIXED: Store image_url properly
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, size, image_url, image_type) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        orderId, 
                        item.product_id, 
                        item.product_name, 
                        item.product_price, 
                        item.quantity, 
                        item.size || '6ft',
                        item.image_url || null,
                        item.image_type || null
                    ]
                );
                
                if (item.product_id) {
                    await connection.execute(
                        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                        [item.quantity, item.product_id, item.quantity]
                    );
                }
            }
            
            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findAll(filters = {}) {
        let query = `SELECT o.*, 
                     (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count 
                     FROM orders o WHERE 1=1`;
        const values = [];
        
        if (filters.user_id) {
            query += ' AND o.user_id = ?';
            values.push(filters.user_id);
        }
        
        if (filters.status) {
            query += ' AND o.status = ?';
            values.push(filters.status);
        }
        
        query += ' ORDER BY o.created_at DESC';
        
        const [rows] = await promisePool.execute(query, values);
        
        for (let order of rows) {
            const [itemsRows] = await promisePool.execute(
                `SELECT * FROM order_items WHERE order_id = ?`,
                [order.id]
            );
            order.items = itemsRows.map(item => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_price: parseFloat(item.product_price),
                quantity: item.quantity,
                size: item.size,
                image_url: item.image_url,
                image_type: item.image_type
            }));
        }
        
        return rows;
    }

    static async findById(id) {
        const [orderRows] = await promisePool.execute('SELECT * FROM orders WHERE id = ?', [id]);
        if (orderRows.length === 0) return null;
        
        const [itemsRows] = await promisePool.execute(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [id]
        );
        
        return {
            ...orderRows[0],
            items: itemsRows.map(item => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_price: parseFloat(item.product_price),
                quantity: item.quantity,
                size: item.size,
                image_url: item.image_url,
                image_type: item.image_type
            }))
        };
    }

    static async findByOrderNumber(orderNumber) {
        const [rows] = await promisePool.execute(
            `SELECT * FROM orders WHERE order_number = ?`,
            [orderNumber]
        );
        
        if (rows.length === 0) return null;
        
        const [itemsRows] = await promisePool.execute(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [rows[0].id]
        );
        
        return {
            ...rows[0],
            items: itemsRows.map(item => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_price: parseFloat(item.product_price),
                quantity: item.quantity,
                size: item.size,
                image_url: item.image_url,
                image_type: item.image_type
            }))
        };
    }

    static async updateStatus(id, status) {
        const [result] = await promisePool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async updatePaymentStatus(id, paymentStatus) {
        const [result] = await promisePool.execute(
            'UPDATE orders SET payment_status = ? WHERE id = ?',
            [paymentStatus, id]
        );
        return result.affectedRows > 0;
    }

    static async getStats() {
        const [totalOrders] = await promisePool.execute('SELECT COUNT(*) as count FROM orders');
        const [totalRevenue] = await promisePool.execute('SELECT SUM(total) as total FROM orders WHERE status != "cancelled"');
        const [pendingOrders] = await promisePool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "pending"');
        const [orderReceived] = await promisePool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "order_received"');
        const [processingOrders] = await promisePool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "processing"');
        const [shippedOrders] = await promisePool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "shipped"');
        const [deliveredOrders] = await promisePool.execute('SELECT COUNT(*) as count FROM orders WHERE status = "delivered"');
        
        const [paidOrders] = await promisePool.execute('SELECT COUNT(*) as count FROM orders WHERE payment_status = "paid"');
        const [pendingPayment] = await promisePool.execute('SELECT COUNT(*) as count FROM orders WHERE payment_status = "pending"');
        
        return {
            totalOrders: totalOrders[0].count,
            totalRevenue: totalRevenue[0].total || 0,
            pendingOrders: pendingOrders[0].count,
            orderReceived: orderReceived[0].count,
            processingOrders: processingOrders[0].count,
            shippedOrders: shippedOrders[0].count,
            deliveredOrders: deliveredOrders[0].count,
            paidOrders: paidOrders[0].count,
            pendingPayment: pendingPayment[0].count
        };
    }
}

module.exports = Order;