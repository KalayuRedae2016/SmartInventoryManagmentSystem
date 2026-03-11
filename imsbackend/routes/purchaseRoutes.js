const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const purchaseController=require("../controllers/purchaseController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


// Protect all routes after this middleware
router.use(authenticationJwt);
  
router.route('/')
      .post(purchaseController.createPurchase)
      .get(purchaseController.getPurchases)
      .delete(purchaseController.cancelPurchase)
      // .delete(purchaseController.deletePurchases);
  
router.route('/:purchaseId')
  .get(purchaseController.getPurchaseById)
  .patch(purchaseController.updatePurchase)
  

router.route('/pay/:purchaseId').patch(purchaseController.payPurchase)

  router.route('/:purchaseId/items')
        .post(purchaseController.addPurchaseItem)
        .get(purchaseController.getPurchaseItems)
        .delete(purchaseController.deleteAllPurchaseItems);

router.route('/:purchaseId/items/:itemId')
    .patch(purchaseController.updatePurchaseItem)
    .delete(purchaseController.deletePurchaseItem);

module.exports=router

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Purchase management APIs
 */

/** Create Purchase
 * @swagger
 * /purchases:
 *   post:
 *     summary: Create new purchase
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             warehouseId: 1
 *             supplierId: 1
 *             totalAmount: 1000
 *             paidAmount: 200
 *             invoiceNumber: "INV-123456"
 *             paymentMethod: "cash"
 *             note: "First purchase"
 *     responses:
 *       201:
 *         description: Purchase created successfully
 */

/** Get Purchases
 * @swagger
 * /purchases:
 *   get:
 *     summary: Get all purchases with filters
 *     tags: [Purchases]
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Purchases fetched successfully
 */

/** Get Purchase by ID
 * @swagger
 * /purchases/{purchaseId}:
 *   get:
 *     summary: Get purchase details by ID
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase retrieved successfully
 *       404:
 *         description: Purchase not found
 */

/** Update Purchase
 * @swagger
 * /purchases/{purchaseId}:
 *   patch:
 *     summary: Update purchase details
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             warehouseId: 2
 *             supplierId: 3
 *             totalAmount: 1200
 *             note: "Updated purchase"
 *             paymentMethod: "credit"
 *     responses:
 *       200:
 *         description: Purchase updated successfully
 */

/** Cancel Purchase
 * @swagger
 * /purchases:
 *   delete:
 *     summary: Cancel a purchase (soft delete)
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase canceled successfully
 */

/** Pay Purchase
 * @swagger
 * /purchases/pay/{purchaseId}:
 *   patch:
 *     summary: Make a payment for a purchase
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         description: ID of the purchase to make payment for
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             amount: 500
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to pay towards the purchase
 *                 example: 500
 *     responses:
 *       200:
 *         description: Payment recorded successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               message: Payment recorded
 *               data:
 *                 id: 1
 *                 invoiceNumber: "INV-123456"
 *                 totalAmount: 1000
 *                 paidAmount: 500
 *                 dueAmount: 500
 *                 status: "partial"
 *       400:
 *         description: Payment exceeds total amount
 *       404:
 *         description: Purchase not found
 */

/** Add Purchase Item
 * @swagger
 * /purchases/{purchaseId}/items:
 *   post:
 *     summary: Add item to a purchase
 *     tags: [PurchaseItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             productId: 1
 *             warehouseId: 1
 *             quantity: 5
 *             unitPrice: 200
 *     responses:
 *       201:
 *         description: Purchase item added successfully
 */

/** Get Purchase Items
 * @swagger
 * /purchases/{purchaseId}/items:
 *   get:
 *     summary: Get all items for a purchase
 *     tags: [PurchaseItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
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
 *         description: Purchase items fetched successfully
 */

/** Update Purchase Item
 * @swagger
 * /purchases/{purchaseId}/items/{itemId}:
 *   patch:
 *     summary: Update a purchase item
 *     tags: [PurchaseItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             quantity: 10
 *             unitPrice: 220
 *             warehouseId: 2
 *             productId: 5
 *     responses:
 *       200:
 *         description: Purchase item updated successfully
 */

/** Delete Purchase Item
 * @swagger
 * /purchases/{purchaseId}/items/{itemId}:
 *   delete:
 *     summary: Delete a purchase item
 *     tags: [PurchaseItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase item deleted successfully
 */

/** Delete All Purchase Items
 * @swagger
 * /purchases/{purchaseId}/items:
 *   delete:
 *     summary: Delete all items of a purchase (eligible)
 *     tags: [PurchaseItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All purchase items deleted successfully
 */