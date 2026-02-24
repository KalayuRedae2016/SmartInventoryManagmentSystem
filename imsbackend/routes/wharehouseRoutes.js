const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const wharehouseController=require("../controllers/wharehouseController")

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
      .post(wharehouseController.createWarehouse)
      .get(wharehouseController.getAllWarehouses)
    //   .delete(wharehouseController.deleteAllWarehouses)

router.route('/:warehouseId')
  .get(wharehouseController.getWarehouseById)
  .patch(wharehouseController.updateWarehouse)
  .delete(wharehouseController.deleteWarehouseById);

  router.route('/togglewarehouseStatus/:warehouseId')
        .patch(wharehouseController.toggleWarehouseStatus);


module.exports=router