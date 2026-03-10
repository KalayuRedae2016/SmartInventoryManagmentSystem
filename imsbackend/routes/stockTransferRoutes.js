const express = require('express');
const stockTransferController = require('../controllers/stockTransferController');

const router = express.Router();

router
  .route('/')
  .get(stockTransferController.getStockTransfers)
  .post(stockTransferController.createStockTransfer);

router
  .route('/:id')
  .get(stockTransferController.getStockTransferById)
  .delete(stockTransferController.deleteStockTransfer);

module.exports = router;
