const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const { createMulterMiddleware } = require('../utils/fileUtils');
const supplierController=require("../controllers/supplierController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


const supplierUploads = createMulterMiddleware(
  'uploads/supplierProfiles',
  'supplierProfile',
  ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
);

const uploadFilesMiddleware = supplierUploads.fields([
  { name: 'profileImage', maxCount: 1 }
]);

// Protect all supplier routes
router.use(authenticationJwt);

router.route('/')
      .post(requirePermission('suppliers.create'), uploadFilesMiddleware, supplierController.createSupplier)
      .get(requirePermission('suppliers.view'), supplierController.getAllSuppliers)
      .delete(requirePermission('suppliers.delete'), supplierController.deleteAllSuppliers);
  

router.route('/:supplierId')
  .get(requirePermission('suppliers.view'), supplierController.getSupplierById)
   .patch(requirePermission('suppliers.update'), uploadFilesMiddleware, supplierController.updateSupplier)
  .delete(requirePermission('suppliers.delete'), supplierController.deleteSupplier);

module.exports=router
