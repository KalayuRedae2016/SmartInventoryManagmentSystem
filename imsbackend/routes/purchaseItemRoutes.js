const express = require('express');
const purchaseItemController = require('../controllers/purchaseItemController');

const router = express.Router();

router
  .route('/')
  .get(purchaseItemController.getPurchaseItems)
  .post(purchaseItemController.createPurchaseItem);

router
  .route('/import')
  .post(purchaseItemController.importPurchaseItems);

router
  .route('/export/:format')
  .get(purchaseItemController.exportPurchaseItems);

router
  .route('/:id')
  .get(purchaseItemController.getPurchaseItemById)
  .put(purchaseItemController.updatePurchaseItem)
  .delete(purchaseItemController.deletePurchaseItem);

router
  .route('/:id/status')
  .patch(purchaseItemController.updatePurchaseItemStatus);

module.exports = router;
