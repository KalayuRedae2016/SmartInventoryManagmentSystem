const express=require("express")
const app = express();
const router=express.Router()

const userController=require("../controllers/userController")
const {createMulterMiddleware}=require("../utils/fileUtils");
const { authenticationJwt,requirePermission,requirePermissionOrSelf} = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

const attachments = createMulterMiddleware(
  'uploads/User', // Destination folder
  'userImages', // Prefix for filenames
  ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'] // Allowed types
);

const uploadFilesMiddleware = attachments.fields([
  { name: 'profileImage', maxCount: 1 },// Single file for profileImage
  { name: 'images', maxCount: 10 }, // upto to 10 images
  { name: 'documents', maxCount: 10 }, // Up to 10 files for documents
]);

// Protect all routes after this middleware

router.use(authenticationJwt);

router.route('/')
      .get(requirePermission('user:create'),userController.getAllUsers)
      .delete(requirePermission('user:delete'),userController.deleteUsers)

router.route('/:userId')
  .get(requirePermissionOrSelf('user:view'),userController.getUser)
  .patch(uploadFilesMiddleware,requirePermissionOrSelf('user:update'),userController.updateUser)
  .delete(requirePermission('user:delete'),userController.deleteUser);

router.patch('/:userId/resetPassword',requirePermission('user:resetPassword'),userController.resetPassword);
router.patch("/:userId/status",requirePermission('user:update'),userController.updateUserStatus);
router.route('/sendEmails').post(requirePermission('user:sendEmail'),userController.sendEmailMessages)

router.route('/import').post(uploadFilesMiddleware,requirePermission('user:import'),userController.importUsersFromExcel)
router.route('/export/excel').get(requirePermission('user:export'),userController.exportUsersToExcel)
router.route('/export/pdf').get(requirePermission('user:export'),userController.exportUsersToPdf)

module.exports=router
