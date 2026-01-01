const express=require("express")
const path=require("path")
const app = express();
const router=express.Router();
const authoController=require("../Controllers/authoController")
const productController=require("../Controllers/productController")
const {createMulterMiddleware}=require("../utils/fileController");

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

const productUploads = createMulterMiddleware(
  path.join(__dirname, "..", "uploads", "products/images"),
  "product",
  ["image/jpeg", "image/png", "application/pdf"]
);

const productFileUpload = productUploads.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "documents", maxCount: 10 }
]);

router.route('/')
  .post(authoController.authenticationJwt, productFileUpload, productController.createProduct);

// Protect all routes after this middleware
router.use(authoController.authenticationJwt);

//router.use(authoController.requiredRole('admin',"staff"));

// router.route('/')
//       .post(authoController.uploadFilesMiddleware,prodcutController.createProduct);
//       .get(prodcutController.getAllProducts)
//       .delete(prodcutController.deleteAllProducts)
  

// router.route('/:categoryId')
//   .get(prodcutController.getProduct)
//   .patch(prodcutController.updateProduct)
//   .delete(prodcutController.deleteProduct);


module.exports=router