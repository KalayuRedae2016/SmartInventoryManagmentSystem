const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const brandController=require("../controllers/brandController")
const { createMulterMiddleware } = require('../utils/fileUtils');

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

const upload = createMulterMiddleware(
  'uploads/brands',
  'brands',
  ['image/jpeg','image/png','application/pdf']
);

const brandAttachements=upload.fields([
    { name: 'profileImage', maxCount: 1 },
     { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 10 },
    { name: 'logo', maxCount: 1 },
  ])

// Protect all routes after this middleware
// router.use(authoController.authenticationJwt);

// router.use(authoController.requiredRole('admin',"staff"));

router.route('/')
      .post(brandAttachements,brandController.createBrand)
      .get(brandController.getAllBrands)
      .delete(brandController.deleteAllBrands);
  
router.route('/:brandId')
  .get(brandController.getBrand)
  .patch(brandAttachements,brandController.updateBrand)
  .delete(brandController.deleteBrand);


module.exports=router