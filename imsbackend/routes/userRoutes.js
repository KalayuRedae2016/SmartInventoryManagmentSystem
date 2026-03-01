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
router.route('/export/excel').get(requirePermission('user:export'),userController.exportUsers)
// router.route('/export/pdf').get(requirePermission('user:export'),userController.exportUsersToPdf)
router.route('/report/dashboard').get(requirePermission('report:view'),userController.getUserDashboardSummary)

module.exports=router
