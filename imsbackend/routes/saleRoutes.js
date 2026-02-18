const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const saleController=require("../controllers/saleController")

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

  router.route('/items')
        .post(saleController.createSaleItem)
        // .get(saleController.getSaleItems)
//         // .delete(saleController.deleteAllSales);
    
//   router.route('/items/:itemId')
//     // .get(saleController.getSaleItemById)
//      .patch(saleController.updateSaleItem)
//     .delete(saleController.deleteSaleItem);

// router.route('/pay/:id')
//   // .patch(saleController.payPurchase)

router.route('/')
      .post(saleController.createSale)
      .get(saleController.getSales)
      // .delete(saleController.deleteSales);
  
router.route('/:id')
  .get(saleController.getSaleById)
   .patch(saleController.updateSale)
  .delete(saleController.deleteSale);


module.exports=router