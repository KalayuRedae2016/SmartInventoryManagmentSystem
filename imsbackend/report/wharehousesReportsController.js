const catchAsync = require('../utils/catchAsync');
const { Op,Sequelize } = require('sequelize');

const {Warehouse,Product,Stock,StockTransfer}= require('../models');

const buildDateFilter = (startDate, endDate) => {
  if (startDate && endDate) {
    return {
      createdAt: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
  }
  return {};// No filter → return empty (get all users)
};

exports.getWarehouseSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stocks = await Stock.findAll({
    include: [
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name'],
        where: { isActive: true }
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'minimumStock']
      }
    ],
    where: buildDateFilter(startDate, endDate)
  });

  const map = {};

  stocks.forEach(s => {
    const wid = s.warehouse.id;

    if (!map[wid]) {
      map[wid] = {
        warehouseId: wid,
        warehouseName: s.warehouse.name,
        totalProducts: new Set(),
        totalStockQuantity: 0,
        lowStock: 0,
        outOfStock: 0
      };
    }

    const qty = s.quantity;
    const min = s.product.minimumStock || 0;

    map[wid].totalProducts.add(s.product.id);
    map[wid].totalStockQuantity += qty;

    if (qty === 0) map[wid].outOfStock++;
    if (qty <= min) map[wid].lowStock++;
  });

  const result = Object.values(map).map(w => ({
    ...w,
    totalProducts: w.totalProducts.size
  }));

  res.json({ status: 1, data: result });
});

exports.getWarehouseDetail = catchAsync(async (req, res) => {
  const { warehouseId, startDate, endDate, page, limit } = req.query;

  const where = {};
  if (warehouseId) where.warehouseId = warehouseId;

  const stocks = await Stock.findAll({
    where: {
      ...where,
      ...buildDateFilter(startDate, endDate)
    },
    include: [
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name']
      },
      {
        model: Product,
        as: 'product',
        attributes: [
          'id',
          'name',
          'sku',
          'defaultCostPrice',
          'defaultSellingPrice'
        ]
      }
    ],
    // ...getPagination(page, limit)
  });

  const grouped = {};

  stocks.forEach(s => {
    const wid = s.warehouse.id;

    if (!grouped[wid]) {
      grouped[wid] = {
        warehouseId: wid,
        warehouseName: s.warehouse.name,
        products: []
      };
    }

    grouped[wid].products.push({
      productId: s.product.id,
      productName: s.product.name,
      sku: s.product.sku,
      quantity: s.quantity,
      costPrice: s.product.defaultCostPrice,
      sellingPrice: s.product.defaultSellingPrice
    });
  });

  res.json({
    status: 1,
    data: Object.values(grouped)
  });
});

exports.getWarehouseStockValue = catchAsync(async (req, res) => {
  const stocks = await Stock.findAll({
    include: [
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['defaultCostPrice']
      }
    ]
  });

  const result = {};

  stocks.forEach(s => {
    const wid = s.warehouse.id;

    if (!result[wid]) {
      result[wid] = {
        warehouseId: wid,
        warehouseName: s.warehouse.name,
        totalValue: 0
      };
    }

    result[wid].totalValue += s.quantity * s.product.defaultCostPrice;
  });

  res.json({
    status: 1,
    data: Object.values(result)
  });
});

exports.getWarehouseTransfers = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const transfers = await StockTransfer.findAll({
    where: buildDateFilter(startDate, endDate),
    include: [
      { model: Warehouse, as: 'fromWarehouse' },
      { model: Warehouse, as: 'toWarehouse' }
    ]
  });

  res.json({ status: 1, data: transfers });
});