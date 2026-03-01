const { db } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const { getDateFilter, getPagination, getSorting } = require('../utils/reportHelpers');

const Warehouse = db.Warehouse;
const Product = db.Product;
const Stock = db.Stock;

// Warehouse Summary
exports.getWarehouseSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const warehouses = await Warehouse.findAll({
    where: { isActive: true },
    include: [
      {
        model: Product,
        as: 'products',
        required: false,
        include: [
          {
            model: Stock,
            as: 'stocks',
            required: false,
            where: { createdAt: getDateFilter(startDate, endDate) },
          }
        ]
      }
    ]
  });

  const summary = warehouses.map(w => {
    const totalProducts = w.products.length;
    const totalStockQuantity = w.products.reduce((sum, p) =>
      sum + (p.stocks?.reduce((s, stock) => s + stock.quantity, 0) || 0), 0
    );

    const lowStock = w.products.filter(p =>
      (p.stocks?.reduce((s, stock) => s + stock.quantity, 0) || 0) < (p.minimumStock || 1)
    ).length;

    const outOfStock = w.products.filter(p =>
      (p.stocks?.reduce((s, stock) => s + stock.quantity, 0) || 0) === 0
    ).length;

    return {
      warehouseId: w.id,
      warehouseName: w.name,
      totalProducts,
      totalStockQuantity,
      lowStock,
      outOfStock
    };
  });

  res.status(200).json({ status: 1, data: summary });
});

// Warehouse Detailed Report
exports.getWarehouseDetail = catchAsync(async (req, res) => {
  const { warehouseId, startDate, endDate, page, limit, sortBy, order } = req.query;

  const where = {};
  if (warehouseId) where.id = warehouseId;

  const warehouses = await Warehouse.findAll({
    where,
    include: [
      {
        model: Product,
        as: 'products',
        required: false,
        include: [
          {
            model: Stock,
            as: 'stocks',
            required: false,
            where: { createdAt: getDateFilter(startDate, endDate) },
          }
        ]
      }
    ],
    ...getPagination(page, limit),
    ...getSorting(sortBy, order)
  });

  const details = warehouses.map(w => ({
    warehouseId: w.id,
    warehouseName: w.name,
    products: w.products.map(p => {
      const stockQty = p.stocks?.reduce((s, stock) => s + stock.quantity, 0) || 0;
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantity: stockQty,
        costPrice: p.defaultCostPrice,
        sellingPrice: p.defaultSellingPrice
      };
    })
  }));

  res.status(200).json({ status: 1, data: details });
});