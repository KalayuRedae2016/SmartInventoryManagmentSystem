const express = require('express');
const stockController = require('../controllers/stockController');

const router = express.Router();

router
  .route('/')
  .get(stockController.getStocks)
  .post(stockController.createStock);

router
  .route('/import')
  .post(stockController.importStocks);

router
  .route('/export/:format')
  .get(stockController.exportStocks);

router
  .route('/:id')
  .get(stockController.getStockById)
  .put(stockController.updateStock)
  .delete(stockController.deleteStock);

router
  .route('/:id/adjust')
  .patch(stockController.adjustStock);

module.exports = router;
