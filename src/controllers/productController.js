const Product = require('../models/Product');

const getProducts = async (req, res) => {
    try {
        const { category, search, status } = req.query;
        const products = await Product.findAll({ category, search, status });
        
        // Add imageUrl for frontend
        const productsWithImage = products.map(product => ({
            ...product,
            imageUrl: product.product_image ? `data:${product.image_type || 'image/jpeg'};base64,${product.product_image}` : null
        }));
        
        res.json({ success: true, products: productsWithImage });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const productWithImage = {
            ...product,
            imageUrl: product.product_image ? `data:${product.image_type || 'image/jpeg'};base64,${product.product_image}` : null
        };
        
        res.json({ success: true, product: productWithImage });
    } catch (error) {
        console.error('Get product by id error:', error);
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, badge, status } = req.body;
        
        let product_image = null;
        let image_type = null;
        
        if (req.file) {
            // Convert file buffer to binary for database storage
            product_image = req.file.buffer;
            image_type = req.file.mimetype;
        }
        
        const productId = await Product.create({ 
            name, 
            description, 
            price, 
            category, 
            stock, 
            product_image,
            image_type,
            badge, 
            status 
        });
        
        const product = await Product.findById(productId);
        const productWithImage = {
            ...product,
            imageUrl: product.product_image ? `data:${product.image_type || 'image/jpeg'};base64,${product.product_image}` : null
        };
        
        res.status(201).json({ success: true, product: productWithImage });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        if (req.file) {
            updateData.product_image = req.file.buffer;
            updateData.image_type = req.file.mimetype;
        }
        
        const updated = await Product.update(req.params.id, updateData);
        if (!updated) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const product = await Product.findById(req.params.id);
        const productWithImage = {
            ...product,
            imageUrl: product.product_image ? `data:${product.image_type || 'image/jpeg'};base64,${product.product_image}` : null
        };
        
        res.json({ success: true, product: productWithImage });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };