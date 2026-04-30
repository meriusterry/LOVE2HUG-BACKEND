const { promisePool } = require('../config/database');

// Create contact message in database
const createContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        // Save to database
        const [result] = await promisePool.execute(
            `INSERT INTO contact_messages (name, email, subject, message, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [name, email, subject, message]
        );
        
        // Log the message (optional)
        console.log(`New contact message from ${name} (${email}): ${subject}`);
        
        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully',
            messageId: result.insertId
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send message. Please try again.' 
        });
    }
};

// Get all contact messages (admin only)
const getContactMessages = async (req, res) => {
    try {
        const [rows] = await promisePool.execute(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
        );
        res.json({ success: true, messages: rows });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get single contact message (admin only)
const getContactMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await promisePool.execute(
            'SELECT * FROM contact_messages WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        
        res.json({ success: true, message: rows[0] });
    } catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark message as read (admin only)
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await promisePool.execute(
            'UPDATE contact_messages SET is_read = TRUE WHERE id = ?',
            [id]
        );
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete contact message (admin only)
const deleteContactMessage = async (req, res) => {
    try {
        const { id } = req.params;
        await promisePool.execute(
            'DELETE FROM contact_messages WHERE id = ?',
            [id]
        );
        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createContactMessage, 
    getContactMessages, 
    getContactMessage,
    markAsRead, 
    deleteContactMessage 
};