const Order = require('../models/Order');

const createOrder = async (req, res) => {
    try {
        const { customer_name, customer_email, customer_phone, shipping_address, city, province, postal_code, items, subtotal, shipping_cost, tax, total, payment_method } = req.body;
        
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        // ALL orders start as PENDING
        let orderStatus = 'pending';
        let paymentStatus = 'pending';
        let successMessage = 'Order placed successfully! 🎉';
        
        if (payment_method === 'card') {
            orderStatus = 'pending';
            paymentStatus = 'pending';
            successMessage = '🔐 Order created. Redirecting to payment gateway...';
        } else if (payment_method === 'eft') {
            orderStatus = 'pending';
            paymentStatus = 'pending';
            successMessage = '📧 Order received! Please complete the EFT payment.';
        } else if (payment_method === 'cash') {
            orderStatus = 'pending';
            paymentStatus = 'pending';
            successMessage = '🚚 Order placed! You will pay when your bears are delivered.';
        }
        
        const orderData = {
            order_number: orderNumber,
            user_id: req.user?.id || null,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            city,
            province,
            postal_code,
            subtotal,
            shipping_cost: shipping_cost || 0,
            tax: tax || 0,
            total,
            status: orderStatus,
            payment_method,
            payment_status: paymentStatus
        };
        
        const orderId = await Order.create(orderData, items);
        const order = await Order.findById(orderId);
        
        res.status(201).json({ 
            success: true, 
            order,
            message: successMessage
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getOrders = async (req, res) => {
    try {
        const filters = {};
        if (req.user.role !== 'admin') {
            filters.user_id = req.user.id;
        }
        if (req.query.status) {
            filters.status = req.query.status;
        }
        const orders = await Order.findAll(filters);
        
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        console.error('Get order by id error:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Order.updateStatus(req.params.id, status);
        if (!updated) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const order = await Order.findById(req.params.id);
        res.json({ success: true, order, message: `Order status updated to ${status}` });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: error.message });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { payment_status } = req.body;
        const updated = await Order.updatePaymentStatus(req.params.id, payment_status);
        if (!updated) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = await Order.findById(req.params.id);
        res.json({ success: true, order, message: `Payment status updated to ${payment_status}` });
    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getOrderStats = async (req, res) => {
    try {
        const stats = await Order.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = await Order.findByOrderNumber(orderNumber);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        console.error('Get order by number error:', error);
        res.status(500).json({ message: error.message });
    }
};

// RULE: Frontend polls this endpoint to check payment status
const getPaymentStatus = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = await Order.findByOrderNumber(orderNumber);
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }
        
        res.json({ 
            success: true, 
            status: order.status,
            paymentStatus: order.payment_status,
            orderNumber: order.order_number
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createOrder, 
    getOrders, 
    getOrderById, 
    updateOrderStatus, 
    updatePaymentStatus,
    getOrderStats,
    getOrderByNumber,
    getPaymentStatus
};