const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const { errorHandler } = require('./middleware/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const payfastRoutes = require('./routes/payfastRoutes');

// Add this import
const contactRoutes = require('./routes/contactRoutes');

dotenv.config();

const app = express();

// ✅ CORS configuration
app.use(cors({
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Logging middleware
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
});

// ✅ Serve static files from uploads directory (MUST be before routes)
app.use('/uploads', express.static('uploads'));

// ✅ HEALTH ROUTES FIRST
app.get('/api/health', (req, res) => {
    console.log('✅ Health check endpoint called');
    res.status(200).json({
        status: 'OK',
        message: 'Love2Hug API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test', (req, res) => {
    console.log('✅ Test endpoint called');
    res.json({ 
        message: 'Backend is working!',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Love2Hug API Server',
        endpoints: {
            health: '/api/health',
            test: '/api/test',
            auth: '/api/auth',
            products: '/api/products',
            orders: '/api/orders',
            payfast: '/api/payfast'
        }
    });
});


// ✅ Test DB connection
testConnection();

// ✅ API ROUTES (in correct order)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payfast', payfastRoutes);  // PayFast routes added here

// Add this with other routes (around line 50)
app.use('/api/contact', contactRoutes);

console.log('✅ Routes registered:');
console.log('   - /api/auth');
console.log('   - /api/products');
console.log('   - /api/orders');
console.log('   - /api/payfast');

// ✅ 404 handler - should be AFTER all routes
app.use((req, res) => {
    console.log(`❌ Route not found: ${req.originalUrl}`);
    res.status(404).json({ 
        message: 'Route not found',
        requestedUrl: req.originalUrl
    });
});

// ✅ Error handler LAST
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api/health`);
    console.log(`📍 Test: http://localhost:${PORT}/api/test`);
});

module.exports = app;