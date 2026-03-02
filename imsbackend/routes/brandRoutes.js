const express = require("express");
const router = express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const brandController = require("../controllers/brandController");
const { createMulterMiddleware } = require('../utils/fileUtils');

const upload = createMulterMiddleware(
  'uploads/brands',
  'brands',
  ['image/jpeg','image/png','application/pdf']
);

const brandAttachments = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'image', maxCount: 3 },
  { name: 'images', maxCount: 10 },
  { name: 'documents', maxCount: 10 },
  { name: 'logo', maxCount: 1 },
]);

// Protect all routes
router.use(authenticationJwt);

// Routes
router.route('/')
  .post(requirePermission("brand:create"), brandAttachments, brandController.createBrand)
  .get(requirePermission("brand:view"), brandController.getAllBrands)
  .delete(requirePermission("brand:delete"), brandController.deleteAllBrands);

router.get('/report/products',
  requirePermission("brand:view"),
  brandController.Brandproductreport
);

router.route('/:brandId')
  .get(requirePermission("brand:view"), brandController.getBrand)
  .patch(requirePermission("brand:update"), brandAttachments, brandController.updateBrand)
  .delete(requirePermission("brand:delete"), brandController.deleteBrand);

router.patch('/:brandId/toggle-status',
  requirePermission("brand:update"),
  brandController.toggleBrandStatus
);

router.get('/summary/report',
  requirePermission("brand:view"),
  brandController.getBrandSummaryReport
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Brand management APIs
 */

/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               country:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Brand created successfully
 *   get:
 *     summary: Get all brands
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brands fetched successfully
 *   delete:
 *     summary: Delete all brands
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All brands deleted successfully
 */

/**
 * @swagger
 * /brands/{brandId}:
 *   get:
 *     summary: Get brand by ID including product count and product list
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Brand fetched successfully
 *   patch:
 *     summary: Update brand details
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               country:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *   delete:
 *     summary: Delete a brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 */

/**
 * @swagger
 * /brands/{brandId}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Brand status toggled successfully
 */

/**
 * @swagger
 * /brands/report/products:
 *   get:
 *     summary: Get brands with product count and product list
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brand product report fetched successfully
 */

/**
 * @swagger
 * /brands/summary/report:
 *   get:
 *     summary: Get brand summary report
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Brand summary fetched successfully
 */