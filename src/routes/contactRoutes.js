const express = require('express');
const { 
    createContactMessage, 
    getContactMessages, 
    getContactMessage,
    markAsRead, 
    deleteContactMessage 
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route - anyone can send a message
router.post('/', createContactMessage);

// Admin only routes
router.get('/', protect, admin, getContactMessages);
router.get('/:id', protect, admin, getContactMessage);
router.put('/:id/read', protect, admin, markAsRead);
router.delete('/:id', protect, admin, deleteContactMessage);

module.exports = router;