const express = require('express');
const router = express.Router();


const { protect } = require('../middlewares/authMiddleware');

const { 
  addStockBatch, 
  updateStockBatch, 
  getStockSummaryByProduct 
} = require('../controllers/productStockController');


router.put('/:id', protect, updateStockBatch);
router.post('/add', protect, addStockBatch);
router.get('/summary/:productId', protect, getStockSummaryByProduct);


module.exports = router;
