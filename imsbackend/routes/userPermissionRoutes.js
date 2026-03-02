const express=require("express")
const app = express();
const router=express.Router()

const userController=require("../controllers/userController")
const userPermissionController=require("../controllers/userPermissionController")
const { authenticationJwt,requirePermission,requirePermissionOrSelf} = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

router.use(authenticationJwt)

router.route('/:userId')
  .get(requirePermission('user:view'), userPermissionController.getUserPermissions)
  .post(requirePermission('user:update'), userPermissionController.assignPermissionsToUser)
  .delete(requirePermission('user:update'), userPermissionController.removePermissionFromUser)
  
router.patch('/:userId/:permissionId/toggle',
  requirePermission('user:update'), userPermissionController.toggleUserPermission);

router.delete('/:userId/clear',
  requirePermission('user:update'), userPermissionController.clearUserPermissions);

router.get('/:userId/report',
  requirePermission('user:view'), userPermissionController.getUserPermissionSummary);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: UserPermissions
 *   description: Manage user-specific permissions
 */

/**getUserPermissions
 * @swagger
 * /permissions/{userId}:
 *   get:
 *     summary: Get all permissions assigned to a user
 *     tags: [UserPermissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Permissions fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               data:
 *                 - id: 1
 *                   permissionId: 2
 *                   granted: true
 *                   permission:
 *                     id: 2
 *                     name: "View Products"
 *                     key: "product:view"
 *                     module: "Products"
 *                     description: "Allows viewing product details"
 *       404:
 *         description: User not found
 */

/**assignPermissionsToUser
 * @swagger
 * /permissions/{userId}:
 *   post:
 *     summary: Assign permissions to a user
 *     tags: [UserPermissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             permissionIds: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               message: "Permissions assigned successfully"
 *               data:
 *                 userId: 5
 *                 permissionIds: [1,2,3]
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 */

/**removePermissionFromUser
 * @swagger
 * /permissions/{userId}:
 *   delete:
 *     summary: Remove one or more permissions from a user
 *     tags: [UserPermissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             permissionIds: [2, 3]
 *     responses:
 *       200:
 *         description: Permissions removed successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               message: "2 permission(s) removed from user"
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User or permission not found
 */

/**toggleUserPermission
 * @swagger
 * /permissions/{userId}/{permissionId}/toggle:
 *   patch:
 *     summary: Toggle a user's permission (grant/revoke)
 *     tags: [UserPermissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the permission to toggle
 *     responses:
 *       200:
 *         description: Permission toggled successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               message: "Permission granted" 
 *               data:
 *                 userId: 5
 *                 permissionId: 2
 *                 granted: true
 *       404:
 *         description: User or permission not found
 */

/**clearUserPermissions
 * @swagger
 * /permissions/{userId}/clear:
 *   delete:
 *     summary: Remove all permissions assigned to a user
 *     tags: [UserPermissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All permissions cleared for the user
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               message: "All permissions removed from user"
 *       404:
 *         description: User not found
 */

/**getUserPermissionSummary
 * @swagger
 * /permissions/{userId}/summary/report:
 *   get:
 *     summary: Get advanced permission summary for a user
 *     tags: [UserPermissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User permission summary fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               data:
 *                 totals:
 *                   totalPermissions: 12
 *                   grantedPermissions: 10
 *                   revokedPermissions: 2
 *                   grantedPercentage: 83.33
 *                   revokedPercentage: 16.67
 *                 moduleDistribution:
 *                   - module: "Products"
 *                     total: 5
 *                   - module: "Sales"
 *                     total: 7
 *                 recentPermissions:
 *                   - id: 2
 *                     name: "View Products"
 *                     key: "product:view"
 *                     module: "Products"
 *                     granted: true
 */