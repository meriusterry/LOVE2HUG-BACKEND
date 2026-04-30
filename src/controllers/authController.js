const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, email, role) => {
    return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

const register = async (req, res) => {
    try {
        const { name, email, password, phone, address, city, province, postal_code } = req.body;
        
        // Check if user exists
        const userExists = await User.findByEmail(email);
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create user
        const userId = await User.create({ name, email, password, phone, address, city, province, postal_code });
        const user = await User.findById(userId);
        
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: generateToken(user.id, user.email, user.role)
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Check password
        const isPasswordValid = await User.comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        
        res.json({
            success: true,
            user: userData,
            token: generateToken(user.id, user.email, user.role)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, phone, address, city, province, postal_code } = req.body;
        const userId = req.user.id;
        
        const updated = await User.update(userId, {
            name,
            phone,
            address,
            city,
            province,
            postal_code
        });
        
        if (!updated) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = await User.findById(userId);
        res.json({ success: true, user, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, getMe, updateProfile };