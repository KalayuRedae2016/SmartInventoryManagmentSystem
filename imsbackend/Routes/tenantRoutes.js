const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const tenantController=require("../controllers/TenantController") 

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


// Protect all routes after this middleware
//router.use(authoController.authenticationJwt);

//router.use(authoController.requiredRole('admin',"staff"));

router.route('/')
      .post(tenantController.createTenant)
      .get(tenantController.getAllTenants)
      .delete(tenantController.deleteAllTenants);

router.route('/:tenantId')
  .get(tenantController.getTenantById)
  .patch(tenantController.updateTenant)
  .delete(tenantController.deleteTenant);


module.exports=router