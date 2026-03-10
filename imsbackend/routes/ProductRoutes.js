const express = require("express");
const app = express();
const router = express.Router();

const { authenticationJwt, requirePermission } = require("../utils/authUtils");
const productController = require("../controllers/productController");

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// Protect all routes
router.use(authenticationJwt);

router.route("/")
  .post(requirePermission("product:create"), productController.createProduct)
  .get(requirePermission("product:view"), productController.getAllProducts);

router.delete("/:productId/hard-delete",requirePermission("product:delete"),productController.hardDeleteProduct);
router.delete("/delete/all", requirePermission("product:delete"), productController.deleteAllProducts);

router.get("/latest",requirePermission("product:view"),productController.getLatestProducts);
router.get("/top-selling",requirePermission("product:view"),productController.getTopSellingProducts);
router.get("/stock-insights",requirePermission("product:view"), productController.getProductInsights);
router.get("/stock-valuation",requirePermission("product:view"), productController.getStockValuation);
router.get("/:productId/purchase-history",requirePermission("product:view"),productController.getProductPurchaseHistory);
router.get("/:productId/sale-history",requirePermission("product:view"),productController.getProductSaleHistory);

router.post("/import",requirePermission("product:create"),productController.uploadProductFile,productController.importProducts);
router.get("/export",requirePermission("product:view"),productController.exportProducts);

router.route("/:productId")
  .get(requirePermission("product:view"), productController.getProductById)
  .patch(requirePermission("product:update"), productController.updateProduct)
  .delete(requirePermission("product:delete"), productController.deleteProduct);

module.exports = router;
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management APIs
 */

/** create Product
 * @swagger
 * /products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             businessId: 1
 *             name: "Laptop"
 *             sku: "LP100"
 *             partNumber: "LP-2024"
 *             categoryId: 1
 *             brandId: 1
 *             unitId: 1
 *             defaultCostPrice: 900
 *             defaultSellingPrice: 1200
 *             minimumStock: 5
 *             barcode: "123456789"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Product created successfully
 */
/** getAllProduct
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: minCost
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxCost
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Products fetched successfully
 */

/**getProductById
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
/**updateProduct
 * @swagger
 * /products/{productId}:
 *   patch:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product updated successfully
 */

/**DeleteProduct
 * @swagger
 * /products/{productId}:
 *   delete:
 *     summary: Soft delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */

/**latestProduct
 * @swagger
 * /products/latest:
 *   get:
 *     summary: Get latest products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest products fetched successfully
 */

/**TopSelling
 * @swagger
 * /products/top-selling:
 *   get:
 *     summary: Get top selling products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top selling products
 */

/**Stock Valuation
 * @swagger
 * /products/stock-valuation:
 *   get:
 *     summary: Stock valuation report
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           example: FIFO
 *     responses:
 *       200:
 *         description: Stock valuation report
 */
/** Stock-insights
 * @swagger
 * /products/stock-insights:
 *   get:
 *     summary: Get product insights (low stock or dead stock)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           example: Select type->lowStock,currentStock,deadStock
 *     responses:
 *       200:
 *         description: Product insights
 */
/**PurchaseHistory
 * @swagger
 * /products/{productId}/purchase-history:
 *   get:
 *     summary: Get product purchase history
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
/**SaleHistory
 * @swagger
 * /products/{productId}/sale-history:
 *   get:
 *     summary: Get product sale history
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */


/**
 * @swagger
 * /products/import:
 *   post:
 *     summary: Import products from Excel file
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Products imported
 */

/**
 * @swagger
 * /products/export/to-excel-pdf:
 *   get:
 *     summary: Export products in Excel or PDF format
 *     tags: [Products]
 *     parameters:
 *       - name: format
 *         in: query
 *         schema:
 *           type: string
 *           enum: [excel, pdf]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File generated
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
