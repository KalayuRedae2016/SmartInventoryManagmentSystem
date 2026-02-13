const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const customerController=require("../controllers/customerController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
})


// Protect all routes after this middleware
// router.use(authoController.authenticationJwt);

// router.use(authoController.requiredRole('admin',"staff"));

router.route('/')
      .post(customerController.createCustomer)
      .get(customerController.getAllCustomers)
    .delete(customerController.deleteAllCustomers)
  

router.route('/:customerId')
  .get(customerController.getCustomerById)
   .patch(customerController.updateCustomer)
  .delete(customerController.deleteCustomer);


module.exports=router