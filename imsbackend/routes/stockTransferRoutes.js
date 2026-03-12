const express = require('express');
const router = express.Router();
const { authenticationJwt,requirePermission} = require('../utils/authUtils');
const stockTransferController = require('../controllers/stockTransferController');

router.use(authenticationJwt);

router.route('/')
  .post(stockTransferController.createStockTransfer)
  .get(stockTransferController.getStockTransfers);

router.route('/:transferId')
  .get(stockTransferController.getStockTransferById)
  .patch(stockTransferController.updateStockTransfer) 
  .delete(stockTransferController.deleteStockTransfer);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: StockTransfers
 *   description: Stock transfer management APIs
 */

/**
 * @swagger
 * /stock-transfers:
 *   post:
 *     summary: Create a stock transfer
 *     tags: [StockTransfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromWarehouseId
 *               - toWarehouseId
 *               - productId
 *               - userId
 *               - quantity
 *             properties:
 *               fromWarehouseId:
 *                 type: integer
 *               toWarehouseId:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               note:
 *                 type: string
 */

/**
 * @swagger
 * /stock-transfers:
 *   get:
 *     summary: Get all stock transfers
 *     tags: [StockTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fromWarehouseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: toWarehouseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 */

/**
 * @swagger
 * /stock-transfers/{transferId}:
 *   get:
 *     summary: Get a stock transfer by ID
 *     tags: [StockTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */

/**
 * @swagger
 * /stock-transfers/{transferId}:
 *   patch:
 *     summary: Update a stock transfer (quantity and note)
 *     tags: [StockTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *               note:
 *                 type: string
 */

/**
 * @swagger
 * /stock-transfers/{transferId}:
 *   delete:
 *     summary: Delete a stock transfer and revert stock changes
 *     tags: [StockTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */