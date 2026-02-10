const express = require('express');
const router = express.Router();


const { protect } = require('../middlewares/authMiddleware');
const { addProduct, updateProduct } = require('../controllers/productController');


// Add new product (Protected Route)

router.post('/', protect, addProduct);

// update product
router.put('/:id', protect, updateProduct);



module.exports = router;
