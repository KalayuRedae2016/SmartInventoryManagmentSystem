const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const { createMulterMiddleware } = require('../utils/fileUtils');
const customerController=require("../controllers/customerController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
})


// Protect all customer routes
router.use(authenticationJwt);
const customerUploads = createMulterMiddleware(
  'uploads/customerProfiles',
  'customerProfile',
  ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
);

const uploadFilesMiddleware = customerUploads.fields([
  { name: 'profileImage', maxCount: 1 }
]);

router.route('/')
      .post(requirePermission('customers.create'), uploadFilesMiddleware, customerController.createCustomer)
      .get(requirePermission('customers.view'), customerController.getAllCustomers)
    .delete(requirePermission('customers.delete'), customerController.deleteAllCustomers)
  

router.route('/:customerId')
  .get(requirePermission('customers.view'), customerController.getCustomerById)
   .patch(requirePermission('customers.update'), uploadFilesMiddleware, customerController.updateCustomer)
  .delete(requirePermission('customers.delete'), customerController.deleteCustomer);


module.exports=router
