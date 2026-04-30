const { generatePayment, validateITN } = require('../services/payfastService');
const { promisePool } = require('../config/database');

const initiatePayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        console.log('=== INITIATE PAYMENT ===');
        console.log('Order ID:', orderId);
        
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID required' });
        }
        
        const [orders] = await promisePool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
        const order = orders[0];
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        console.log('Order found:', order.order_number);
        console.log('Order total:', order.total);
        console.log('Current status:', order.status, 'Payment status:', order.payment_status);
        
        const result = await generatePayment({
            order_number: order.order_number,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            total: parseFloat(order.total)
        });
        
        if (result.success) {
            console.log('Payment URL generated - Redirecting to PayFast');
            res.json({ success: true, paymentUrl: result.paymentUrl });
        } else {
            res.status(500).json({ success: false, message: result.error });
        }
    } catch (error) {
        console.error('Initiate payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// THIS HANDLES AUTOMATIC DATABASE UPDATES VIA ITN
const handleITN = async (req, res) => {
    try {
        console.log('=== ITN RECEIVED - AUTOMATIC UPDATE ===');
        console.log('ITN Data:', req.body);
        
        // Validate signature
        const isValid = validateITN(req.body);
        if (!isValid) {
            console.error('Invalid signature - Potential fraud');
            return res.status(400).send('Invalid signature');
        }
        
        const { m_payment_id, payment_status, amount, pf_payment_id } = req.body;
        
        console.log(`Processing order: ${m_payment_id}, Payment Status from PayFast: ${payment_status}`);
        
        // Find the order
        const [orders] = await promisePool.execute(
            'SELECT * FROM orders WHERE order_number = ?',
            [m_payment_id]
        );
        const order = orders[0];
        
        if (!order) {
            console.error(`Order not found: ${m_payment_id}`);
            return res.status(404).send('Order not found');
        }
        
        console.log(`Current DB status: order_status=${order.status}, payment_status=${order.payment_status}`);
        
        // AUTOMATIC UPDATE based on PayFast response
        if (payment_status === 'COMPLETE') {
            // SUCCESSFUL: Update to order_received and paid
            await promisePool.execute(
                'UPDATE orders SET status = ?, payment_status = ? WHERE order_number = ?',
                ['order_received', 'paid', m_payment_id]
            );
            console.log(`✅ AUTOMATIC UPDATE SUCCESS: Order ${m_payment_id} - status=order_received, payment=paid`);
        } else if (payment_status === 'FAILED') {
            // FAILED: Keep order_status as pending, set payment_status to failed
            await promisePool.execute(
                'UPDATE orders SET payment_status = ? WHERE order_number = ?',
                ['failed', m_payment_id]
            );
            console.log(`❌ AUTOMATIC UPDATE FAILED: Order ${m_payment_id} - payment=failed`);
        } else {
            console.log(`⚠️ Unknown payment status: ${payment_status} for order: ${m_payment_id}`);
        }
        
        // Verify the update
        const [updatedOrder] = await promisePool.execute(
            'SELECT order_number, status, payment_status FROM orders WHERE order_number = ?',
            [m_payment_id]
        );
        console.log(`Updated order:`, updatedOrder[0]);
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('ITN error:', error);
        res.status(500).send('Error');
    }
};

const handleReturn = async (req, res) => {
    console.log('=== RETURN URL HIT ===');
    const { payment_status, m_payment_id } = req.query;
    
    console.log(`Return: Order ${m_payment_id}, Status from PayFast: ${payment_status}`);
    
    if (payment_status === 'COMPLETE') {
        res.redirect(`http://localhost:3000/orders?payment=processing&order_number=${m_payment_id}`);
    } else {
        res.redirect(`http://localhost:3000/orders?payment=failed&order_number=${m_payment_id}`);
    }
};

const handleCancel = async (req, res) => {
    console.log('Cancel URL hit');
    res.redirect('http://localhost:3000/cart?payment=cancelled');
};

module.exports = { initiatePayment, handleITN, handleReturn, handleCancel };