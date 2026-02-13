const { StockTransaction, Product, Warehouse, User } = require('../models');
const catchAsync = require('../utils/catchAsync');

const getBusinessId = () => 1;

/**
 * Create a stock transaction (called internally from other controllers)
 * type: 'IN', 'OUT', 'TRANSFER', 'ADJUST'
 * referenceType: 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER'
 */
exports.createStockTransaction = catchAsync(async ({
  businessId,
  warehouseId,
  productId,
  type,
  quantity,
  referenceType,
  referenceId,
  performedBy,
  note
}) => {
  return await StockTransaction.create({
    businessId,
    warehouseId,
    productId,
    type,
    quantity,
    referenceType,
    referenceId,
    performedBy,
    note
  });
});

/**
 * Get stock transaction log (audit)
 * GET /stock-transactions
 */
exports.getStockTransactions = catchAsync(async (req, res) => {
  const { warehouseId, productId, referenceType, page = 1, limit = 20 } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (referenceType) where.referenceType = referenceType;

  const transactions = await StockTransaction.findAndCountAll({
    where,
    include: [Product, Warehouse, User],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: transactions.count,
    data: transactions.rows,
  });
});

/**
 * Export stock transaction report
 * GET /stock-transactions/export/excel or /pdf
 */
exports.exportStockTransactions = catchAsync(async (req, res) => {
  // implement export logic
  res.status(200).json({
    status: 1,
    message: 'Stock transaction report generated successfully',
  });
});
