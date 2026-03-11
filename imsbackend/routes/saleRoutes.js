const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const saleController = require("../controllers/saleController");


app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


// Protect all routes after this middleware
router.use(authenticationJwt);

router.route("/")
  .post(saleController.createSale)
  .get(saleController.getSales)
  .delete(saleController.cancelSale);

router.route("/:saleId")
  .get(saleController.getSaleById)
  .patch(saleController.updateSale)
  

router.route("/pay/:saleId")
  .patch(saleController.paySale);

router.route("/:saleId/items")
  .post(saleController.addSaleItem)
  .get(saleController.getSaleItems)
  // .delete(saleController.deleteAllSaleItems);

router.route("/:saleId/items/:itemId")
  .patch(saleController.updateSaleItem)
  .delete(saleController.deleteSaleItem);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sale management APIs
 */

/** Create Sale
 * @swagger
 * /sales:
 *   post:
 *     summary: Create new sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             warehouseId: 1
 *             customerId: 1
 *             totalAmount: 1000
 *             paidAmount: 200
 *             invoiceNumber: "INV-2026-001"
 *             paymentMethod: "cash"
 *             note: "First sale"
 *     responses:
 *       201:
 *         description: Sale created successfully
 */

/** Get Sales
 * @swagger
 * /sales:
 *   get:
 *     summary: Get all sales with filters
 *     tags: [Sales]
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
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Sales fetched successfully
 */

/** Get Sale by ID
 * @swagger
 * /sales/{saleId}:
 *   get:
 *     summary: Get sale details by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sale retrieved successfully
 *       404:
 *         description: Sale not found
 */

/** Update Sale
 * @swagger
 * /sales/{saleId}:
 *   patch:
 *     summary: Update sale details
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             warehouseId: 2
 *             customerId: 3
 *             totalAmount: 1200
 *             note: "Updated sale"
 *             paymentMethod: "credit"
 *     responses:
 *       200:
 *         description: Sale updated successfully
 */

/** Cancel Sale
 * @swagger
 * /sales/{saleId}:
 *   delete:
 *     summary: Cancel a sale (soft delete)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sale canceled successfully
 */

/** Pay Sale
 * @swagger
 * /sales/pay/{saleId}:
 *   patch:
 *     summary: Make a payment for a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         description: ID of the sale to make payment for
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
 *                 description: Amount to pay towards the sale
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
 *                 invoiceNumber: "INV-2026-001"
 *                 totalAmount: 1000
 *                 paidAmount: 500
 *                 dueAmount: 500
 *                 status: "partial"
 *       400:
 *         description: Payment exceeds total amount
 *       404:
 *         description: Sale not found
 */

/** Add Sale Item
 * @swagger
 * /sales/{saleId}/items:
 *   post:
 *     summary: Add item to a sale
 *     tags: [SaleItems]
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
 *         description: Sale item added successfully
 */

/** Get Sale Items
 * @swagger
 * /sales/{saleId}/items:
 *   get:
 *     summary: Get all items for a sale
 *     tags: [SaleItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
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
 *         description: Sale items fetched successfully
 */

/** Update Sale Item
 * @swagger
 * /sales/{saleId}/items/{itemId}:
 *   patch:
 *     summary: Update a sale item
 *     tags: [SaleItems]
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
 *         description: Sale item updated successfully
 */

/** Delete Sale Item
 * @swagger
 * /sales/{saleId}/items/{itemId}:
 *   delete:
 *     summary: Delete a sale item
 *     tags: [SaleItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sale item deleted successfully
 */

/** Delete All Sale Items
 * @swagger
 * /sales/{saleId}/items:
 *   delete:
 *     summary: Delete all items of a sale
 *     tags: [SaleItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sale items deleted successfully
 */