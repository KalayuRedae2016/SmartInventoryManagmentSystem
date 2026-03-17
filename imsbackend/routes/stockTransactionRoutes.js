const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');

const stockTransactionController=require("../controllers/stockTransactionController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

// Protect all routes after this middleware
router.use(authenticationJwt);

router.route('/')
  .get(stockTransactionController.getStockTransactions)
  // .post(stockTransactionController.createStockTransaction);

router
  .route('/:transactionId')
  .get(stockTransactionController.getStockTransaction)
  
router.route('/export/to-excel-pdf').get(stockTransactionController.exportStockTransactions);

module.exports = router;
