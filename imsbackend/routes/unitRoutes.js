const express = require("express");
const router = express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const unitController = require("../controllers/unitController");

// Protect all routes
router.use(authenticationJwt);

router.route('/')
  .post(requirePermission("unit:create"), unitController.createUnit)
  .get(requirePermission("unit:view"), unitController.getAllUnits)
  .delete(requirePermission("unit:delete"), unitController.deleteAllUnits);


router.get('/report/products',  requirePermission("unit:view"),
  unitController.unitProductreport
);

router.route('/:unitId')
  .get(requirePermission("unit:view"), unitController.getUnit)
  .patch(requirePermission("unit:update"), unitController.updateUnit)
  .delete(requirePermission("unit:delete"), unitController.deleteUnit);

router.patch('/:unitId/toggle-status', requirePermission("unit:update"),
  unitController.toggleUnitStatus
);
  
  router.get('/summary/report',    requirePermission("unit:view"),
    unitController.getUnitSummaryReport
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Units
 *   description: Unit management APIs
 */

/**
 * @swagger
 * /units:
 *   post:
 *     summary: Create a new unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             businessId: 1
 *             name: "Kilogram"
 *             symbol: "kg"
 *             baseUnit: "Gram"
 *             operator: "*"
 *             operationValue: "1000"
 *             description: "Weight measurement unit"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Unit created successfully
 *       409:
 *         description: Unit already exists
 *
 *   get:
 *     summary: Get all units
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
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
 *         description: Units fetched successfully
 *
 *   delete:
 *     summary: Delete all units
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All units deleted successfully
 */

/**
 * @swagger
 * /units/report/products:
 *   get:
 *     summary: Get units with product count and product list
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unit product report fetched successfully
 */

/**
 * @swagger
 * /units/{unitId}:
 *   get:
 *     summary: Get unit by ID including product count and products
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Unit fetched successfully
 *       404:
 *         description: Unit not found
 *
 *   patch:
 *     summary: Update unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             name: "Gram"
 *             symbol: "g"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *
 *   delete:
 *     summary: Delete a unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 */

/**
 * @swagger
 * /units/{unitId}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Unit status toggled successfully
 */

/**
 * @swagger
 * /units/summary/report:
 *   get:
 *     summary: Get unit summary report
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unit summary report fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               totalUnits: 10
 *               activeUnits: 7
 *               inactiveUnits: 3
 */