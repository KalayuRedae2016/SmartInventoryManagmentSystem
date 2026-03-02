const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const categoryController=require("../controllers/categoryController")

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
  .post(requirePermission("category:create"), categoryController.createCategory)
  .get(requirePermission("category:view"), categoryController.getAllCategories);

router.get('/report/products',
  requirePermission("category:view"),
  categoryController.categoryProductReport
);

router.route('/:categoryId')
  .get(requirePermission("category:view"), categoryController.getCategoryById)
  .patch(requirePermission("category:update"), categoryController.updateCategoryById)
  .delete(requirePermission("category:delete"), categoryController.deleteCategoryById);

router.patch('/:categoryId/toggle-status',
  requirePermission("category:update"),
  categoryController.toggleCategoryStatus);

router.get('/summary/report',
  requirePermission("category:view"),
  categoryController.getCategorySummaryReport);

module.exports=router

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management APIs
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Electronics"
 *             description: "Electronic products category"
 *             isActive: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *       409:
 *         description: Category already exists
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 */

/**
 * @swagger
 * /categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category retrieved
 *       404:
 *         description: Category not found
 */

/**
 * @swagger
 * /categories/{categoryId}:
 *   patch:
 *     summary: Update category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category updated
 */

/**
 * @swagger
 * /categories/{categoryId}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category deleted
 */

/**
 * @swagger
 * /categories/{categoryId}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status toggled successfully
 */

/**
 * @swagger
 * /categories/summary/report:
 *   get:
 *     summary: Get category summary report
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category summary report
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               totalCategories: 20
 *               activeCategories: 15
 *               inactiveCategories: 5
 */

/**
 * @swagger
 * /categories/report/products:
 *   get:
 *     summary: Get categories with product count and product list
 *     description: Returns each category with total number of products and list of products
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter categories by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search category by name
 *     responses:
 *       200:
 *         description: Category product report fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               totalCategories: 2
 *               data:
 *                 - categoryId: 1
 *                   name: "Electronics"
 *                   description: "Electronic items"
 *                   isActive: true
 *                   totalProducts: 3
 *                   products:
 *                     - id: 10
 *                       name: "Laptop"
 *                       sku: "LP100"
 *                       price: 1500
 *                       quantity: 25
 *                       isActive: true
 */