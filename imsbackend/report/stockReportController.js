'use strict';

const { Op,Sequelize} = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const {Sale,SaleItem,Stock,Purchase,PurchaseItem,StockTransfer,StockAdjustment,Product,Warehouse,User} = require('../models');
'use strict';

const buildFilters = ({ warehouseId, productId }) => {
  const where = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  return where;
};

const getDateFilter = (start, end) => ({
  [Op.between]: [new Date(start), new Date(end)]
});

exports.currentStock = catchAsync(async (req, res) => {
  const where = buildFilters(req.query);

  const stocks = await Stock.findAll({
    where,
    include: [
      { model: Product,as:"product",attributes: ["id", "name", "defaultCostPrice", "minimumStock"]},
      { model: Warehouse,as:"warehouse", attributes: ['id', 'name'] }
    ]
  });

  console.log("stock",stocks)

  const totalQty = stocks.reduce((sum, s) => sum + s.quantity, 0);
  const totalValue = stocks.reduce((sum, s) => sum + (s.quantity * s.product.defaultCostPrice),  0 );

  res.status(200).json({
    status: 1,
    totalProducts: stocks.length, 
    totalQty, totalValue,
    data: stocks
  });
});

exports.lowStock = catchAsync(async (req, res) => {
  const stocks = await Stock.findAll({
    include: [{
      model: Product,as:"product",attributes: ["id", "name", "minimumStock"],
      where: { minimumStock: { [Op.ne]: null } }
    }]
  });

 const data = stocks.filter(s => s.quantity <= (s.product.minimumStock || 0));

  res.status(200).json({
    status: 1,
    count: data.length,
    data
  });
});

exports.deadStock = catchAsync(async (req, res) => {
  const { days = 90 } = req.query;

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - parseInt(days));

  const stocks = await Stock.findAll({
    where: { quantity: { [Op.gt]: 0 } },
    include: [{  model: Product,as:"product",attributes: ["id", "name", "minimumStock"] }]
  });
  

  const result = [];

  for (const stock of stocks) {
    const lastSale = await SaleItem.findOne({
      where: { productId: stock.productId },
      include: [{ model: Sale,as:"sale"}],
      order: [['createdAt', 'DESC']]
    });

    if (!lastSale || new Date(lastSale.sale.saleDate) < thresholdDate) {
      result.push({
        productId: stock.productId,
        productName: stock.Product.name,
        quantity: stock.quantity,
        lastSold: lastSale ? lastSale.Sale.saleDate : null
      });
    }
  }

  res.status(200).json({
    status: 1,
    summary: { deadProducts: result.length },
    data: result
  });
});

exports.fastMoving = catchAsync(async (req, res) => {
  const { startDate, endDate, top = 10 } = req.query;

  const where = {};
  if (startDate && endDate) where.saleDate = getDateFilter(startDate, endDate);

  const data = await SaleItem.findAll({
    include: [
      { model: Sale,as:"sale", where, attributes: [] },
      { model: Product,as:"product", attributes: ['id', 'name'] }
    ],
    attributes: [
      'productId',
      [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold']
    ],
    group: ['productId', 'Product.id'],
    order: [[Sequelize.literal('totalSold'), 'DESC']],
    limit: parseInt(top)
  });

  res.status(200).json({ status: 1, data });
});

exports.slowMoving = catchAsync(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;

  const where = {};
  if (startDate && endDate) where.saleDate = getDateFilter(startDate, endDate);

  const data = await SaleItem.findAll({
    include: [
      { model: Sale,as:"sale", where, attributes: [] },
      { model: Product,as:"product", attributes: ['id', 'name'] }
    ],
    attributes: [
      'productId',
      [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold']
    ],
    group: ['productId', 'Product.id'],
    order: [[Sequelize.literal('totalSold'), 'ASC']],
    limit: parseInt(limit)
  });

  res.status(200).json({ status: 1, data });
});

exports.stockValuation = catchAsync(async (req, res) => {
  const { method = 'AVERAGE' } = req.query;

  const stocks = await Stock.findAll({
    include: [{ model: Product,as:"product", attributes: ['id', 'name', 'defaultCostPrice'] }]
  });

  let totalValue = 0;

  const data = [];

  for (const s of stocks) {
    let value = 0;

    if (method === 'AVERAGE') {
      value = s.quantity * s.product.defaultCostPrice;
    }

    if (method === 'FIFO') {
      const layers = await PurchaseItem.findAll({
        where: { productId: s.productId },
        order: [['createdAt', 'ASC']]
      });

      let qty = s.quantity;
      for (const l of layers) {
        if (qty <= 0) break;
        const used = Math.min(qty, l.quantity);
        value += used * l.cost;
        qty -= used;
      }
    }

    totalValue += value;

    data.push({
      product: s.product.name,
      quantity: s.quantity,
      value
    });
  }

  res.status(200).json({
    status: 1,
    summary: { totalValue },
    data
  });
});

exports.transferSummary = catchAsync(async (req, res) => {
  const transfers = await StockTransfer.findAll();

  const total = transfers.length;
  const qty = transfers.reduce((s, t) => s + t.quantity, 0);

  res.status(200).json({
    status: 1,
    totalTransfers: total,
    totalQty: qty 
  });
});

exports.adjustmentSummary = catchAsync(async (req, res) => {
  const adjustments = await StockAdjustment.findAll();
  console.log("ad",adjustments)

  const increase = adjustments.filter(a => a.adjustmentType === 'IN').reduce((s, a) => s + a.quantity, 0);
  const decrease = adjustments.filter(a => a.adjustmentType === 'OUT').reduce((s, a) => s + a.quantity, 0);

  res.status(200).json({
    status: 1,
    totalAdjustment:adjustments.length,
    totalIncrease:increase,
    totalDecrease:decrease
        
  });
});