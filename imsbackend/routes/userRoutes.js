const express=require("express")
const app = express();
const router=express.Router()

const userController=require("../controllers/userController")

const { authenticationJwt,requirePermission,requirePermissionOrSelf} = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

// Protect all routes after this middleware

router.use(authenticationJwt);

router.route('/')
      .get(requirePermission('user:view'),userController.getAllUsers)
      .delete(requirePermission('user:delete'),userController.deleteUsers)

router.route('/:userId')
  .get(requirePermissionOrSelf('user:view'),userController.getUser)
  .patch(userController.uploaduserAttachements,requirePermissionOrSelf('user:update'),userController.updateUser)
  .delete(requirePermission('user:delete'),userController.deleteUser);

router.patch('/:userId/resetPassword',requirePermission('user:resetPassword'),userController.resetPassword);
router.patch("/:userId/status",requirePermission('user:update'),userController.updateUserStatus);
router.route('/sendEmails').post(requirePermission('user:sendEmail'),userController.sendEmailMessages)

router.route('/import').post(userController.uploaduserFile,requirePermission('user:import'),userController.importUsers)
router.route('/export/to-excel-pdf').get(requirePermission('user:export'),userController.exportUsers)
router.route('/report/dashboard').get(requirePermission('report:view'),userController.getUserDashboardSummary)

module.exports=router


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management routes
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update user by ID
 *     tags: [Users]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 */

/**
 * @swagger
 * /users/{userId}/resetPassword:
 *   patch:
 *     summary: Reset a user's password
 *     tags: [Users]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password reset
 */

/**
 * @swagger
 * /users/{userId}/status:
 *   patch:
 *     summary: Update a user's status (active/inactive)
 *     tags: [Users]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: isActive
 *         in: query
 *         required: true
 *         schema:
 *           type: boolean
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */

/**
 * @swagger
 * /users/sendEmails:
 *   post:
 *     summary: Send emails to users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Emails sent successfully
 */

/**
 * @swagger
 * /users/import:
 *   post:
 *     summary: Import users from Excel file
 *     tags: [Users]
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
 *         description: Users imported
 */

/**
 * @swagger
 * /users/export/to-excel-pdf:
 *   get:
 *     summary: Export users in Excel or PDF format
 *     tags: [Users]
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

/**
 * @swagger
 * /users/report/dashboard:
 *   get:
 *     summary: Get dashboard summary for users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */

