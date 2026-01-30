const express=require("express")
const app = express();
const router=express.Router();
const businessController=require("../controllers/businessController"); 
const { createMulterMiddleware } = require('../utils/fileUtils');


app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

const upload = createMulterMiddleware(
  'uploads/users',
  'user',
  ['image/jpeg','image/png','application/pdf']
);

const businessAttachements=upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 10 },
    { name: 'logo', maxCount: 1 },
  ])


// Protect all routes after this middleware
//router.use(authoController.authenticationJwt);

//router.use(authoController.requiredRole('admin',"staff"));

router.route('/')
      .post(businessAttachements,businessController.createBusiness)
      .get(businessController.getAllBusiness)
//    .delete(businessController.deleteAllBusinesses);

router.route('/:businessId')
  .get(businessController.getBusinessById)
  .patch(businessAttachements,businessController.updateBusinessById)
  .delete(businessController.deleteBusinessById);


module.exports=router