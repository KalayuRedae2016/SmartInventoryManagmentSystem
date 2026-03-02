const express=require("express")
const app = express();
const router=express.Router()

const permissionController = require('../controllers/permissionController');
const { authenticationJwt, requirePermission } = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

router.use(authenticationJwt);

router.route('/')
  .post(requirePermission('permission:create'), permissionController.createPermission)
  .get(requirePermission('permission:view'), permissionController.getPermissions)
  // .delete(requirePermission('permission:delete'), permissionController.deleteAllPermission);

router.route('/:permissionId')
  .get(requirePermission('permission:view'), permissionController.getPermission)
  .patch(requirePermission('permission:update'), permissionController.updatePermission)
  .delete(requirePermission('permission:delete'), permissionController.deletePermission);

router.patch('/:permissionId/toggle-status',
  requirePermission('permission:update'),  permissionController.togglePermissionStatus);
router.get('/summary/report',
  requirePermission('permission:view'), permissionController.getPermissionAdvancedSummary);


module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Advanced Permission Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         businessId:
 *           type: integer
 *         name:
 *           type: string
 *         key:
 *           type: string
 *         module:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create new permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Create User"
 *             key: "user:create"
 *             module: "User"
 *             description: "Allows creating users"
 *     responses:
 *       200:
 *         description: Permission created successfully
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get permissions with filter, search, pagination and grouping
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter by module
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, key or description
 *
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *
 *       - in: query
 *         name: groupByModule
 *         schema:
 *           type: boolean
 *         description: Group result by module
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Records per page (default 10)
 *
 *     responses:
 *       200:
 *         description: Permissions fetched successfully
 */

/**
 * @swagger
 * /permissions/{permissionId}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission details
 */

/**
 * @swagger
 * /permissions/{permissionId}:
 *   patch:
 *     summary: Update permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             name: "Updated Name"
 *             description: "Updated description"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Permission updated successfully
 */

/**
 * @swagger
 * /permissions/{permissionId}:
 *   delete:
 *     summary: Delete permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 */

/**
 * @swagger
 * /permissions/{permissionId}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission status toggled successfully
 */

/**
 * @swagger
 * /permissions/delete-all:
 *   delete:
 *     summary: Delete all permissions (dangerous operation)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All permissions deleted successfully
 */

/**
 * @swagger
 * /permissions/summary/report:
 *   get:
 *     summary: Advanced permission dashboard summary
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Advanced analytics fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               data:
 *                 totals:
 *                   totalPermissions: 45
 *                   activePermissions: 38
 *                   inactivePermissions: 7
 *                   activePercentage: "84.44"
 *                   inactivePercentage: "15.56"
 *                 moduleDistribution:
 *                   - module: "User"
 *                     total: 12
 *                   - module: "Product"
 *                     total: 8
 *                 recentPermissions:
 *                   - id: 50
 *                     name: "Approve Sales"
 *                     key: "sales:approve"
 *                     module: "Sales"
 *                     createdAt: "2026-03-02T10:00:00Z"
 */