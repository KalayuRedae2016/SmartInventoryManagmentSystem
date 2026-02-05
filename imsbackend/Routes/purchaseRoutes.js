const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const purchaseController=require("../controllers/purchaseController")

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
      .post(purchaseController.createPurchase)
      .get(purchaseController.getPurchases)
      .delete(purchaseController.deletePurchases);
  
router.route('/:id')
  .get(purchaseController.getPurchaseById)
   .patch(purchaseController.updatePurchase)
  .delete(purchaseController.deletePurchase);

router.route('/pay/:id')
  // .patch(purchaseController.payPurchase)

  router.route('/items')
        .post(purchaseController.createPurchaseItem)
        .get(purchaseController.getPurchaseItems)
        // .delete(purchaseController.deleteAllPurchases);
    
  router.route('/items/:purchaseItemId')
    // .get(purchaseController.getPurchaseItemById)
     .patch(purchaseController.updatePurchaseItem)
    .delete(purchaseController.deletePurchaseItem);

module.exports=router