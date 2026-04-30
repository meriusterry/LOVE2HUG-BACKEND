const express = require('express');
const multer = require('multer');
const path = require('path');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Use memory storage to store image in buffer (not on disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, admin, upload.single('product_image'), createProduct);
router.put('/:id', protect, admin, upload.single('product_image'), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;