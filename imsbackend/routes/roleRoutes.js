
const express = require('express');
const router = express.Router();

const roleController = require('../controllers/roleController');
const { authenticationJwt, requirePermission } = require('../utils/authUtils');

/* =======================
   MIDDLEWARE
======================= */
router.use(authenticationJwt);

/* =======================
   REAL ROUTES (LOGIC FIRST)
======================= */
router
  .route('/')
  .get(requirePermission('role:view'), roleController.getRoles)
  .post(requirePermission('role:create'), roleController.createRole)
  // .delete(requirePermission('role:delete'), roleController.deleteRoles);

router
  .route('/:roleId')
  .get(requirePermission('role:view'), roleController.getRole)
  .patch(requirePermission('role:update'), roleController.updateRole)
  .delete(requirePermission('role:delete'), roleController.deleteRole);

router.get(
  '/:roleId/users',
  requirePermission('role:view'),
  roleController.getUsersByRole
);

router.post(
  '/:roleId/assign',
  requirePermission('role:update'),
  roleController.assignUsersToRole
);
router.patch(
  '/:roleId/status',
  requirePermission('role:update'),
  roleController.changeRoleStatus
);


module.exports = router;

/* =====================================================
   SWAGGER DOCUMENTATION (ALL AT BOTTOM ✅)
===================================================== */

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created
 */

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
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
 *         description: Role details
 */

/**
 * @swagger
 * /roles/{roleId}:
 *   patch:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *     responses:
 *       200:
 *         description: Role updated
 */

/**
 * @swagger
 * /roles/{roleId}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Role deleted
 */

/**
 * @swagger
 * /roles/{roleId}/users:
 *   get:
 *     summary: Get users assigned to a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *     responses:
 *       200:
 *         description: Users list
 */

/**
 * @swagger
 * /roles/{roleId}/assign:
 *   post:
 *     summary: Assign users to role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Users assigned successfully
 */