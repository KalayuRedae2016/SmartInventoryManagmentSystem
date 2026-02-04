const { Stock, Product, Warehouse } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

/**
 * Get current stock levels (report)
 * GET /stocks
 */
exports.getStocks = catchAsync(async (req, res) => {
  const { warehouseId, productId, page = 1, limit = 20 } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;

  const stocks = await Stock.findAndCountAll({
    where,
    include: [Product, Warehouse],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: stocks.count,
    data: stocks.rows,
  });
});

/**
 * Export stock report
 * GET /stocks/export/excel or /stocks/export/pdf
 */
exports.exportStocks = catchAsync(async (req, res) => {
  // implement your export logic (Excel, PDF) based on query filters
  res.status(200).json({
    status: 1,
    message: 'Stock export generated successfully',
  });
});
