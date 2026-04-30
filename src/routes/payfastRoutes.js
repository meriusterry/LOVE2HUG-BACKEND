const express = require('express');
const { initiatePayment, handleITN, handleReturn, handleCancel } = require('../controllers/payfastController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Test routes FIRST
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'PayFast routes working!' });
});

// IMPORTANT: This must be BEFORE any other middleware that might interfere
router.post('/notify', express.urlencoded({ extended: true, limit: '10mb' }), (req, res, next) => {
    console.log('Notify endpoint hit!');
    console.log('Body:', req.body);
    next();
}, handleITN);

router.post('/initiate', protect, initiatePayment);
router.get('/return', handleReturn);
router.get('/cancel', handleCancel);

module.exports = router;