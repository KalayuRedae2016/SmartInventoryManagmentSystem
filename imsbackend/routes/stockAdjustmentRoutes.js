const express = require('express');
const router = express.Router();
const stockAdjustmentController = require('../controllers/stockAdjustmentController');

router.route('/')
  .post(stockAdjustmentController.createStockAdjustment)
  .get(stockAdjustmentController.getStockAdjustments);

router.route('/:id')
  .get(stockAdjustmentController.getStockAdjustmentById)
  .patch(stockAdjustmentController.updateStockAdjustment)
  .delete(stockAdjustmentController.deleteStockAdjustment);

module.exports = router;
