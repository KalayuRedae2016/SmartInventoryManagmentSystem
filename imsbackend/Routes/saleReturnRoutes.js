const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const saleReturnController=require("../controllers/saleReturnController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

// Protect all routes after this middleware
// router.use(authoController.authenticationJwt);

// router.use(authoController.requiredRole('admin',"staff"));

  router.route('/items')
      .post(saleReturnController.createSaleReturnItem)
      // .get(saleReturnController.getSaleReturnItems)
      // .delete(saleReturnController.deleteAllSalReturnItems);
  
router.route('/items/:id')
  // .get(saleReturnController.getSaleReturnItem)
.patch(saleReturnController.updateSaleReturnItem)
  .delete(saleReturnController.deleteSaleReturnItem);

router.route('/')
      .post(saleReturnController.createSaleReturn)
      .get(saleReturnController.getSaleReturns)
      // .delete(saleReturnController.deleteAllSaleReturns);
  
router.route('/:id')
  // .get(saleReturnController.getSaleReturn)
  .patch(saleReturnController.updateSaleReturn)
  .delete(saleReturnController.deleteSaleReturn);




module.exports=router