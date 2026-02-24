const express = require('express');
const router = express.Router();
const stockTransactionController = require('../controllers/stockTransactionController');

router.route('/')
  .get(stockTransactionController.getStockTransactions);

router.route('/export/:format')
  .get(stockTransactionController.exportStockTransactions);

module.exports = router;
