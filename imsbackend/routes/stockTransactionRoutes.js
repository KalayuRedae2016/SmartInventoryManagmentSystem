const express = require('express');
const router = express.Router();

const { authenticationJwt } = require('../utils/authUtils');
const stockTransactionController = require('../controllers/stockTransactionController');

// Protect all stock transaction routes
router.use(authenticationJwt);

// GET /stock-transactions
router
  .route('/')
  .get(stockTransactionController.getStockTransactions);

// GET /stock-transactions/export/:format (excel/pdf)
router
  .route('/export/:format')
  .get(stockTransactionController.exportStockTransactions);

module.exports = router;

