const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const stockAdjustmentController = require('../controllers/stockAdjustmentController');

router.use(authenticationJwt);

router.route('/')
  .post(stockAdjustmentController.createStockAdjustment)
  .get(stockAdjustmentController.getStockAdjustments);

router.route('/:adjustmentId')
  .get(stockAdjustmentController.getStockAdjustmentById)
  .patch(stockAdjustmentController.updateStockAdjustment)
  .delete(stockAdjustmentController.deleteStockAdjustment);

module.exports = router;
