const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const supplierController=require("../controllers/supplierController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


// Protect all routes after this middleware
// router.use(authenticationJwt);

// router.use(requirePermission('admin',"staff"));

router.route('/')
      .post(supplierController.createSupplier)
      .get(supplierController.getAllSuppliers)
      .delete(supplierController.deleteAllSuppliers);
  

router.route('/:supplierId')
  .get(supplierController.getSupplierById)
   .patch(supplierController.updateSupplier)
   .patch(supplierController.updateSupplier)
  .delete(supplierController.deleteSupplier);

module.exports=router