const express = require('express');
const { 
    createOrder, 
    getOrders, 
    getOrderById, 
    updateOrderStatus,
    updatePaymentStatus,
    getOrderStats,
    getOrderByNumber,
    getPaymentStatus
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/stats', protect, admin, getOrderStats);
router.get('/payment-status/:orderNumber', protect, getPaymentStatus); // For frontend polling
router.get('/by-number/:orderNumber', protect, getOrderByNumber);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/payment-status', protect, admin, updatePaymentStatus);

module.exports = router;