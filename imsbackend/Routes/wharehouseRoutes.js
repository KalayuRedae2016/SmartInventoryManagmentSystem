const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../Controllers/authoController")
const wharehouseController=require("../Controllers/wharehouseController")

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
      .post(wharehouseController.createWarehouse)
      .get(wharehouseController.getAllWarehouses)
      .delete(wharehouseController.deleteAllWarehouses)

router.route('/:warehouseId')
  .get(wharehouseController.getWarehouseById)
  .patch(wharehouseController.updateWarehouse)
  .delete(wharehouseController.deleteWarehouse);


module.exports=router