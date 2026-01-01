const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../Controllers/authoController")
const customerController=require("../Controllers/customerController")

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
    //   .post(authoController.uploadFilesMiddleware,customerController.createCustomer)
      .get(customerController.getAllCustomers)
      .delete(customerController.deleteAllCustomers)
  

router.route('/:customerId')
  .get(customerController.getCustomer)
//    .patch(authoController.uploadFilesMiddleware,customerController.updateCustomer)
  .delete(customerController.deleteCustomer);


module.exports=router