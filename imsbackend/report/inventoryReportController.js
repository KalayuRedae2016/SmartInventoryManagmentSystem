'use strict';

const {db}=require('../../models')
const { Op } = require('sequelize');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const QueryHelper = require('../../utils/queryHelper');
const {Sale,SaleItem,Stock,Purchase,PurchaseItem,StockTransfer,StockAdjustment,Product,Warehouse,User} = require('../../models');

const getDateFilter = (startDate, endDate) => {
  if (startDate && endDate) return { [Op.between]: [new Date(startDate), new Date(endDate)] };
  return {};
};

// Inventory/stock Report
exports.currentStock = catchAsync(async (req, res) => {

  const queryHelper = new QueryHelper(req)
    .addMultipleFilters(['warehouseId', 'productId'])
    .restrictToBusiness(req.user);

  const where = queryHelper.build();
  const order = queryHelper.sort('updatedAt');
  const { limit, offset, page } = queryHelper.paginate();

  const { count, rows } = await Stock.findAndCountAll({
    where,
    include: [
      {
        model: Product,
        attributes: ['id', 'name', 'code', 'category', 'cost', 'price']
      },
      {
        model: Warehouse,
        attributes: ['id', 'name']
      }
    ],
    limit: queryHelper.isExport() ? undefined : limit,
    offset: queryHelper.isExport() ? undefined : offset,
    order
  });

  // ================= SUMMARY =================
  const totalStockQty = rows.reduce((sum, s) => sum + s.quantity, 0);
  const totalStockValue = rows.reduce(
    (sum, s) => sum + (s.quantity * s.Product.cost),
    0
  );

  res.status(200).json({
    status: 1,
    summary: {
      totalRecords: count,
      totalStockQty,
      totalStockValue
    },
    pagination: queryHelper.isExport() ? null : {
      page,
      totalPages: Math.ceil(count / limit)
    },
    data: rows
  });

});

exports.lowStock = catchAsync(async (req, res) => {

  const stocks = await Stock.findAll({
    include: [{
      model: Product,
      where: {
        reorderLevel: { [Op.ne]: null }
      }
    }]
  });

  const lowStocks = stocks.filter(s => 
    s.quantity <= s.Product.reorderLevel
  );

  res.status(200).json({
    status: 1,
    count: lowStocks.length,
    data: lowStocks
  });

});

exports.stockValuation = catchAsync(async (req, res) => {

  const { method = 'AVERAGE' } = req.query;

  const queryHelper = new QueryHelper(req)
    .addMultipleFilters(['warehouseId', 'productId'])
    .restrictToBusiness(req.user);

  const where = queryHelper.build();

  const stocks = await Stock.findAll({
    where,
    include: [{
      model: Product,
      attributes: ['id', 'name', 'code', 'category', 'cost']
    }]
  });

  let totalInventoryValue = 0;
  let totalQuantity = 0;

  const valuationData = [];

  for (const stock of stocks) {

    const quantity = stock.quantity;
    totalQuantity += quantity;

    let stockValue = 0;

    // ================= AVERAGE COST =================
    if (method === 'AVERAGE') {

      const purchases = await PurchaseItem.findAll({
        where: { productId: stock.productId },
        include: [{
          model: Purchase,
          attributes: ['warehouseId']
        }]
      });

      const totalPurchasedQty = purchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalPurchasedCost = purchases.reduce(
        (sum, p) => sum + (p.quantity * p.cost),
        0
      );

      const avgCost = totalPurchasedQty === 0
        ? stock.Product.cost
        : totalPurchasedCost / totalPurchasedQty;

      stockValue = quantity * avgCost;
    }

    // ================= FIFO =================
    if (method === 'FIFO') {

      const purchaseLayers = await PurchaseItem.findAll({
        where: { productId: stock.productId },
        order: [['createdAt', 'ASC']]
      });

      let remainingQty = quantity;
      let fifoValue = 0;

      for (const layer of purchaseLayers) {
        if (remainingQty <= 0) break;

        const layerQty = Math.min(layer.quantity, remainingQty);
        fifoValue += layerQty * layer.cost;
        remainingQty -= layerQty;
      }

      stockValue = fifoValue;
    }

    totalInventoryValue += stockValue;

    valuationData.push({
      productId: stock.productId,
      productName: stock.Product.name,
      warehouseId: stock.warehouseId,
      quantity,
      method,
      stockValue
    });
  }

  res.status(200).json({
    status: 1,
    summary: {
      totalProducts: stocks.length,
      totalQuantity,
      totalInventoryValue
    },
    data: valuationData
  });

});

exports.deadStock = catchAsync(async (req, res) => {

  const { days = 90 } = req.query;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - parseInt(days));

  const queryHelper = new QueryHelper(req)
    .addMultipleFilters(['warehouseId', 'productId'])
    .restrictToBusiness(req.user);

  const where = queryHelper.build();
  where.quantity = { [Op.gt]: 0 };

  const stocks = await Stock.findAll({
    where,
    include: [{
      model: Product,
      attributes: ['id', 'name', 'code', 'category']
    }]
  });

  const deadStockData = [];

  for (const stock of stocks) {

    const lastSale = await SaleItem.findOne({
      where: { productId: stock.productId },
      include: [{
        model: Sale,
        attributes: ['saleDate']
      }],
      order: [['createdAt', 'DESC']]
    });

    let isDead = false;
    let lastSoldDate = null;

    if (!lastSale) {
      isDead = true;
    } else {
      lastSoldDate = lastSale.Sale.saleDate;
      if (new Date(lastSoldDate) < thresholdDate) {
        isDead = true;
      }
    }

    if (isDead) {
      deadStockData.push({
        productId: stock.productId,
        productName: stock.Product.name,
        warehouseId: stock.warehouseId,
        quantity: stock.quantity,
        lastSoldDate
      });
    }
  }

  res.status(200).json({
    status: 1,
    summary: {
      thresholdDays: days,
      deadProducts: deadStockData.length
    },
    data: deadStockData
  });

});

exports.fastMoving = catchAsync(async (req, res) => {

  const { startDate, endDate, top = 10 } = req.query;

  const whereSale = {};
  if (startDate && endDate) {
    whereSale.saleDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const sales = await SaleItem.findAll({
    include: [
      {
        model: Sale,
        where: whereSale,
        attributes: []
      },
      {
        model: Product,
        attributes: ['id', 'name', 'code', 'category']
      }
    ],
    attributes: [
      'productId',
      [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'totalSold']
    ],
    group: ['productId', 'Product.id'],
    order: [[db.Sequelize.literal('totalSold'), 'DESC']],
    limit: parseInt(top)
  });

  res.status(200).json({
    status: 1,
    summary: {
      topProducts: sales.length
    },
    data: sales
  });

});

exports.slowMoving = catchAsync(async (req, res) => {

  const { startDate, endDate, limit = 10 } = req.query;

  const whereSale = {};
  if (startDate && endDate) {
    whereSale.saleDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const sales = await SaleItem.findAll({
    include: [
      {
        model: Sale,
        where: whereSale,
        attributes: []
      },
      {
        model: Product,
        attributes: ['id', 'name', 'code', 'category']
      }
    ],
    attributes: [
      'productId',
      [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'totalSold']
    ],
    group: ['productId', 'Product.id'],
    order: [[db.Sequelize.literal('totalSold'), 'ASC']],
    limit: parseInt(limit)
  });

  res.status(200).json({
    status: 1,
    summary: {
      slowProducts: sales.length
    },
    data: sales
  });

});

exports.transferSummary = catchAsync(async (req, res) => {
  const { startDate, endDate, fromWarehouseId, toWarehouseId } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = getDateFilter(startDate, endDate);
  if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId;
  if (toWarehouseId) where.toWarehouseId = toWarehouseId;

  const transfers = await StockTransfer.findAll({ where });

  const totalTransfers = transfers.length;
  const totalQuantity = transfers.reduce((sum, t) => sum + t.quantity, 0);
  const pendingTransfers = transfers.filter(t => !t.completed).length;
  const completedTransfers = totalTransfers - pendingTransfers;

  res.status(200).json({
    status: 1,
    data: { totalTransfers, totalQuantity, pendingTransfers, completedTransfers }
  });
});

exports.transferDetailed = catchAsync(async (req, res) => {
  const { startDate, endDate, fromWarehouseId, toWarehouseId, productId } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = getDateFilter(startDate, endDate);
  if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId;
  if (toWarehouseId) where.toWarehouseId = toWarehouseId;
  if (productId) where.productId = productId;

  const transfers = await StockTransfer.findAll({
    where,
    include: [
      { model: Product, attributes: ['id', 'name', 'code'] },
      { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name'] },
      { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name'] },
      { model: User, attributes: ['id', 'fullName'] }
    ]
  });

  const data = transfers.map(t => ({
    transferId: t.id,
    product: t.Product.name,
    quantity: t.quantity,
    fromWarehouse: t.fromWarehouse.name,
    toWarehouse: t.toWarehouse.name,
    performedBy: t.User.fullName,
    note: t.note,
    date: t.createdAt
  }));

  res.status(200).json({ status: 1, data });
});

exports.adjustmentSummary = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = getDateFilter(startDate, endDate);
  if (warehouseId) where.warehouseId = warehouseId;

  const adjustments = await StockAdjustment.findAll({ where });

  const totalAdjustments = adjustments.length;
  const increaseQty = adjustments
    .filter(a => a.adjustmentType === 'INCREASE')
    .reduce((sum, a) => sum + a.quantity, 0);
  const decreaseQty = adjustments
    .filter(a => a.adjustmentType === 'DECREASE')
    .reduce((sum, a) => sum + a.quantity, 0);

  const reasons = {};
  adjustments.forEach(a => {
    if (!reasons[a.note]) reasons[a.note] = 0;
    reasons[a.note] += a.quantity;
  });

  res.status(200).json({
    status: 1,
    data: { totalAdjustments, increaseQty, decreaseQty, reasons }
  });
});

exports.adjustmentDetailed = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId, productId } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = getDateFilter(startDate, endDate);
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;

  const adjustments = await StockAdjustment.findAll({
    where,
    include: [
      { model: Product, attributes: ['id', 'name', 'code'] },
      { model: Warehouse, attributes: ['id', 'name'] },
      { model: User, attributes: ['id', 'fullName'] }
    ]
  });

  const data = adjustments.map(a => ({
    adjustmentId: a.id,
    product: a.Product.name,
    warehouse: a.Warehouse.name,
    quantity: a.quantity,
    type: a.adjustmentType,
    reason: a.note,
    performedBy: a.User.fullName,
    date: a.createdAt
  }));

  res.status(200).json({ status: 1, data });
});