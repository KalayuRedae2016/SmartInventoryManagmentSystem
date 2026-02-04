const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const purchaseReturnController=require("../controllers/purchaseReturnController")

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

router.route('/')
      .post(purchaseReturnController.createPurchaseReturn)
      .get(purchaseReturnController.getPurchaseReturns)
      // .delete(purchaseReturnController.deleteAllPurchases);
  
router.route('/:id')
  .get(purchaseReturnController.getPurchaseReturnById)
  .patch(purchaseReturnController.updatePurchaseReturn)
  .delete(purchaseReturnController.deletePurchaseReturn);

module.exports=router