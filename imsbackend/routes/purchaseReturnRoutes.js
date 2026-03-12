const express = require("express");
const router = express.Router();

const { authenticationJwt,requirePermission} = require('../utils/authUtils');
const purchaseReturnController = require("../controllers/purchaseReturnController");

router.use(authenticationJwt);

router.route('/')
  .post(purchaseReturnController.createPurchaseReturn)
  .get(purchaseReturnController.getPurchaseReturns);

router.route('/:purchaseReturnId')
  .get(purchaseReturnController.getPurchaseReturnById)
  .patch(purchaseReturnController.updatePurchaseReturn)
  .delete(purchaseReturnController.deletePurchaseReturn);

// router.route('/:purchaseReturnId/cancel')
//   .patch(purchaseReturnController.cancelPurchaseReturn);

router.route('/:purchaseReturnId/items')
  .post(purchaseReturnController.addPurchaseReturnItem)
  .get(purchaseReturnController.getPurchaseReturnsItems)
  .delete(purchaseReturnController.deleteAllPurchaseReturnItems);

router.route('/:purchaseReturnId/items/:itemId')
  .patch(purchaseReturnController.updatePurchaseReturnItem)
  .delete(purchaseReturnController.deletePurchaseReturnItem);


module.exports = router;

/**
 * @swagger
 * tags:
 *   name: PurchaseReturns
 *   description: Purchase Return management APIs (including items)
 */

/**
 * @swagger
 * /purchase-returns:
 *   post:
 *     summary: Create a purchase return
 *     tags: [PurchaseReturns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             purchaseId: 1
 *             supplierId: 1
 *             warehouseId: 1
 *             totalAmount: 500
 *             note: "Returning damaged goods"
 *     responses:
 *       201:
 *         description: Purchase return created successfully
 */

/**
 * @swagger
 * /purchase-returns:
 *   get:
 *     summary: Get all purchase returns
 *     tags: [PurchaseReturns]
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
 *     responses:
 *       200:
 *         description: Purchase returns fetched successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}:
 *   get:
 *     summary: Get purchase return by ID
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase return retrieved successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}:
 *   patch:
 *     summary: Update a purchase return
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             note: "Updated reason for return"
 *             totalAmount: 600
 *     responses:
 *       200:
 *         description: Purchase return updated successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}/cancel:
 *   patch:
 *     summary: Cancel a purchase return (soft delete)
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase return canceled successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}:
 *   delete:
 *     summary: Delete a purchase return
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase return deleted successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items:
 *   post:
 *     summary: Add item to a purchase return
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             productId: 1
 *             warehouseId: 1
 *             quantity: 2
 *             unitPrice: 150
 *     responses:
 *       201:
 *         description: Purchase return item added successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items:
 *   get:
 *     summary: Get all items for a purchase return
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase return items fetched successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items:
 *   delete:
 *     summary: Delete all items of a purchase return
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All purchase return items deleted successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items/{itemId}:
 *   patch:
 *     summary: Update a purchase return item
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             quantity: 3
 *             unitPrice: 140
 *     responses:
 *       200:
 *         description: Purchase return item updated successfully
 */

/**
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items/{itemId}:
 *   delete:
 *     summary: Delete a purchase return item
 *     tags: [PurchaseReturns]
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase return item deleted successfully
 */