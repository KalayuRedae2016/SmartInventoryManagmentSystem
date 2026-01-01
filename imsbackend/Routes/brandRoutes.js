const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../Controllers/authoController")
const brandController=require("../Controllers/brandController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


// Protect all routes after this middleware
router.use(authoController.authenticationJwt);

router.use(authoController.requiredRole('admin',"staff"));

router.route('/')
      .post(brandController.createBrand)
      .get(brandController.getAllBrands)
      .delete(brandController.deleteAllBrands);
  

router.route('/:brandId')
  .get(brandController.getBrand)
  .patch(brandController.updateBrand)
  .delete(brandController.deleteBrand);


module.exports=router