const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const stockController = require('../controllers/stockController');

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
  .get(stockController.getStocks)
  .post(stockController.createStock);

router
  .route('/:stockId')
  .get(stockController.getStockById)
  .patch(stockController.updateStock)
  .delete(stockController.deleteStock);

router.route('/import').post(stockController.importStocks);
router.route('/export/:format').get(stockController.exportStocks);

module.exports = router;
