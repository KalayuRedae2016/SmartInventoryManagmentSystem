const express=require("express")
const app = express();
const router=express.Router()

const authoController=require("../controllers/authoController")
const { authenticationJwt, requirePermission } = require("../utils/authUtils");

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});



router.post("/signup",authoController.uploaduserAttachements,authoController.signup)
router.post("/login",authoController.login)

router.post('/forgetPassword', authoController.forgetPassword);
router.post('/verifyOTP', authoController.verifyOTP);
router.patch('/resetPassword',authoController.resetPassword);

// // Protect all routes after this middleware

router.use(authenticationJwt);


router.get('/getMe',authoController.getMe);
router.patch('/updateMe',authoController.uploaduserAttachements,authoController.updateMe);
router.patch('/updatemyPassword',authoController.updateMyPassword);

module.exports=router


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user account management
 */

/**Signup
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               roleId:
 *                  type: string
 *               warehouseId:
 *                  type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */

/**Login
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with phoneNumber and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "123456780"
 *               password:
 *                 type: string
 *                 example: "0943662611"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 */

/**ForgetPassword
 * @swagger
 * /auth/forgetPassword:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent to email
 */

/**VerifyOTP
 * @swagger
 * /auth/verifyOTP:
 *   post:
 *     summary: Verify OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               passwordResetOTP:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */

/**resetPassword
 * @swagger
 * /auth/resetPassword:
 *   patch:
 *     summary: Reset password after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */

/**getMe
 * @swagger
 * /auth/getMe:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns current user info
 */

/**updateMe
 * @swagger
 * /auth/updateMe:
 *   patch:
 *     summary: Update logged-in user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Kalayu Redae
 *               email:
 *                 type: string
 *                 example: kalayu@example.com
 *               phoneNumber:
 *                 type: string
 *                 example: "0943662611"
 *               address:
 *                 type: string
 *                 example: Mekelle
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 example: null
 *     responses:
 *       200:
 *         description: User profile updated
 */

/**updateMyPassword
 * @swagger
 * /auth/updatemyPassword:
 *   patch:
 *     summary: Update logged-in user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */