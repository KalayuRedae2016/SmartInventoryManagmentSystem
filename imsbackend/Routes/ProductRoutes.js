const express=require("express")
const path=require("path")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const productController=require("../controllers/productController")
const {createMulterMiddleware}=require("../utils/fileUtils");

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

const upload = createMulterMiddleware(
  'uploads/products',
  'products',
  ['image/jpeg','image/png','application/pdf']
);

const productAttachements=upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 10 },
    { name: 'logo', maxCount: 1 },
  ])

router.route('/')
  .post(productAttachements,productController.createProduct);

// Protect all routes after this middleware
router.use(authoController.authenticationJwt);

router.use(authoController.requiredRole('admin',"staff"));

router.route('/')
      .post(productAttachements,productController.createProduct)
//       .get(productController.getAllProducts)
//       .delete(productController.deleteAllProducts)
  

// router.route('/:categoryId')
//   .get(productController.getProduct)
//   .patch(productController.updateProduct)
//   .delete(productController.deleteProduct);


module.exports=router