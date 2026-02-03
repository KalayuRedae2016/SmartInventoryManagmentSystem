const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const purchaseItemController=require("../controllers/purchaseItemController")

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
      .post(purchaseItemController.createPurchaseItem)
      .get(purchaseItemController.getPurchaseItems)
      // .delete(purchaseItemController.deleteAllPurchases);
  
router.route('/:purchaseId')
  .get(purchaseItemController.getPurchaseItemById)
   .patch(purchaseItemController.updatePurchaseItem)
  .delete(purchaseItemController.deletePurchaseItem);

module.exports=router