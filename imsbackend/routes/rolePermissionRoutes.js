const express=require("express")
const app = express();
const router=express.Router()

const rolePermissionController = require('../controllers/rolePermissionController');
const { authenticationJwt, requirePermission } = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

router.use(authenticationJwt);

router.route('/:roleId')
  .get(requirePermission("role:view"),rolePermissionController.getRolePermissions)
  .post(requirePermission('role:update'), rolePermissionController.assignPermissionsToRole)
  .delete(requirePermission('role:update'), rolePermissionController.removePermissionFromRole);//Remove single or select permission from role

router.route('/:roleId/clear')
  .delete(requirePermission('role:update'), rolePermissionController.clearRolePermissions);//Remove all permission from role

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Role Permissions
 *   description: Manage permissions assigned to roles
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AssignPermissionsRequest:
 *       type: object
 *       required:
 *         - permissionIds
 *       properties:
 *         permissionIds:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 2, 5]
 *
 *     RemovePermissionsRequest:
 *       type: object
 *       required:
 *         - permissionIds
 *       properties:
 *         permissionIds:
 *           type: array
 *           items:
 *             type: integer
 *           example: [2, 4]
 */

/**
 * @swagger
 * /role-permissions/{roleId}:
 *   get:
 *     summary: Get permissions assigned to a role
 *     tags: [Role Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the role
 *     responses:
 *       200:
 *         description: Role permissions fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               result: 3
 *               data:
 *                 - roleId: 1
 *                   permission:
 *                     id: 2
 *                     key: "user:create"
 *                     module: "User"
 *                     description: "Allows creating users"
 *
 *   post:
 *     summary: Assign permissions to role (SYNC - replaces existing)
 *     tags: [Role Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignPermissionsRequest'
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
 *
 *   delete:
 *     summary: Remove selected permissions from role
 *     tags: [Role Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemovePermissionsRequest'
 *     responses:
 *       200:
 *         description: Selected permissions removed successfully
 */

/**
 * @swagger
 * /role-permissions/{roleId}/clear:
 *   delete:
 *     summary: Remove ALL permissions from role
 *     tags: [Role Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All permissions removed from role
 */