const express=require("express")
const app = express();
const router=express.Router()

const authoController=require("../Controllers/authoController")
const userController=require("../Controllers/userController")
const {createMulterMiddleware}=require("../Utils/fileController");

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

// const attachments = createMulterMiddleware(
//   'uploads/profileImages', // Destination folder
//   'profileImage', // Prefix for filenames
//   ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'] // Allowed types
// );

// exports.uploadFilesMiddleware = attachments.fields([
//   { name: 'profileImage', maxCount: 1 },// Single file for profileImage
//   { name: 'images', maxCount: 10 }, // upto to 10 images
//   { name: 'documents', maxCount: 10 }, // Up to 10 files for documents
// ]);

//router.post("/signup",this.uploadFilesMiddleware,authoController.signup)
router.post("/login",authoController.login)

router.post('/forgetPassword', authoController.forgetPassword);
router.post('/verifyOTP', authoController.verifyOTP);
router.patch('/resetPassword',authoController.resetPassword);

// // Protect all routes after this middleware

router.use(authoController.authenticationJwt);

router.patch('/updatePassword',authoController.updatePassword);
//router.patch('/getMe',authoController.uploadFilesMiddleware,authoController.getMe);
// router.patch('/updateMe',authoController.uploadFilesMiddleware,authoController.updateMe);

//router.use(authoController.requiredRole('admin'));

router.patch('/resetPasswordByAdmin/:userId',authoController.resetPasswordByAdmin);
// router.patch('/edituserPermission',userController.toggleEdiUserPermission);

router.route('/')
      .get(userController.getAllUsers)
      .delete(userController.deleteUsers)

router.route('/:userId')
  .get(userController.getUser)
  //.patch(authoController.uploadFilesMiddleware,userController.updateUserProfile)
  .delete(userController.deleteUser);


// router.route('/active-deactive/:userId').put(userController.activateDeactiveUser);
router.route('/sendEmails').post(userController.sendEmailMessages)


module.exports=router