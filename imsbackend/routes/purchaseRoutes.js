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
 *   name: PurchaseReturns
 *   description: Purchase return management APIs
 */

/** Create Purchase Return
 * @swagger
 * /purchase-returns:
 *   post:
 *     summary: Create new purchase return
 *     tags: [PurchaseReturns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             purchaseId: 1
 *             warehouseId: 1
 *             supplierId: 1
 *             totalAmount: 500
 *             reason: "Damaged products returned to supplier"
 *     responses:
 *       201:
 *         description: Purchase return created successfully
 */

/** Get Purchase Returns
 * @swagger
 * /purchase-returns:
 *   get:
 *     summary: Get all purchase returns with filters
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase returns fetched successfully
 */

/** Get Purchase Return by ID
 * @swagger
 * /purchase-returns/{purchaseReturnId}:
 *   get:
 *     summary: Get purchase return details by ID
 *     tags: [PurchaseReturns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseReturnId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase return retrieved successfully
 *       404:
 *         description: Purchase return not found
 */

/** Update Purchase Return
 * @swagger
 * /purchase-returns/{purchaseReturnId}:
 *   patch:
 *     summary: Update purchase return details
 *     tags: [PurchaseReturns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             warehouseId: 2
 *             supplierId: 3
 *             totalAmount: 600
 *             reason: "Updated return reason"
 *             status: "completed"
 *     responses:
 *       200:
 *         description: Purchase return updated successfully
 */

/** Delete Purchase Return
 * @swagger
 * /purchase-returns/{purchaseReturnId}:
 *   delete:
 *     summary: Delete a purchase return (soft delete)
 *     tags: [PurchaseReturns]
 *     security:
 *       - bearerAuth: []
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

/** Add Purchase Return Item
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items:
 *   post:
 *     summary: Add item to a purchase return
 *     tags: [PurchaseReturnItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             productId: 1
 *             warehouseId: 1
 *             quantity: 3
 *             unitPrice: 200
 *     responses:
 *       201:
 *         description: Purchase return item added successfully
 */

/** Get Purchase Return Items
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items:
 *   get:
 *     summary: Get all items for a purchase return
 *     tags: [PurchaseReturnItems]
 *     security:
 *       - bearerAuth: []
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

/** Update Purchase Return Item
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items/{itemId}:
 *   patch:
 *     summary: Update a purchase return item
 *     tags: [PurchaseReturnItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             quantity: 5
 *             unitPrice: 220
 *             warehouseId: 2
 *             productId: 3
 *     responses:
 *       200:
 *         description: Purchase return item updated successfully
 */

/** Delete Purchase Return Item
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items/{itemId}:
 *   delete:
 *     summary: Delete a purchase return item
 *     tags: [PurchaseReturnItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase return item deleted successfully
 */

/** Delete All Purchase Return Items
 * @swagger
 * /purchase-returns/{purchaseReturnId}/items:
 *   delete:
 *     summary: Delete all items of a purchase return (eligible)
 *     tags: [PurchaseReturnItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All purchase return items deleted successfully
 */