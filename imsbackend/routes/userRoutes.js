const express=require("express")
const app = express();
const router=express.Router()

const authoController=require("../controllers/authoController")
const userController=require("../controllers/userController")
const {createMulterMiddleware}=require("../utils/fileUtils");

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

router.use(authoController.authenticationJwt);

router.route('/')
      .get(userController.getAllUsers)
      .delete(userController.deleteUsers)

router.route('/:userId')
  .get(userController.getUser)
  .patch(uploadFilesMiddleware,userController.updateUser)
  .delete(userController.deleteUser);

router.patch('/:userId/resetPassword',userController.resetPassword);
router.patch("/:userId/status",userController.updateUserStatus);
router.route('/sendEmails').post(userController.sendEmailMessages)

router.route('/import').post(uploadFilesMiddleware,userController.importUsersFromExcel)
router.route('/export/excel').get(userController.exportUsersToExcel)
router.route('/export/pdf').get(userController.exportUsersToPdf)

module.exports=router


//this is updated