const { db } = require('../models');
const catchAsync = require('../utils/catchAsync');
const { getDateFilter } = require('../utils/reportHelpers');

const Product = db.Product;
const Stock = db.Stock;
const StockTransaction = db.StockTransaction;
const PurchaseItem = db.PurchaseItem;
const SaleItem = db.SaleItem;
const Warehouse = db.Warehouse;
const Category = db.Category;
const Brand = db.Brand;

// Current Stock Report
exports.getCurrentStockReport = catchAsync(async (req, res) => {
  const { warehouseId, categoryId, brandId } = req.query;
  const whereStock = {};
  if (warehouseId) whereStock.warehouseId = warehouseId;

  const whereProduct = {};
  if (categoryId) whereProduct.categoryId = categoryId;
  if (brandId) whereProduct.brandId = brandId;

  const stocks = await Stock.findAll({
    where: whereStock,
    include: [
      { model: Product, where: whereProduct, include: [Category, Brand] },
      { model: Warehouse }
    ]
  });

  const report = stocks.map(s => ({
    productId: s.productId,
    productName: s.Product.name,
    category: s.Product.Category?.name || null,
    brand: s.Product.Brand?.name || null,
    warehouse: s.Warehouse.name,
    currentStock: s.quantity,
    lastUpdated: s.updatedAt
  }));

  res.status(200).json({ status: 1, data: report });
});

// Low Stock Report
exports.getLowStockReport = catchAsync(async (req, res) => {
  const { warehouseId } = req.query;

  const whereStock = { quantity: { [db.Sequelize.Op.lte]: db.Sequelize.col('Product.minimumStock') } };
  if (warehouseId) whereStock.warehouseId = warehouseId;

  const stocks = await Stock.findAll({
    where: whereStock,
    include: [{ model: Product }, { model: Warehouse }]
  });

  const report = stocks.map(s => ({
    productId: s.productId,
    productName: s.Product.name,
    warehouse: s.Warehouse.name,
    currentStock: s.quantity,
    minimumStock: s.Product.minimumStock
  }));

  res.status(200).json({ status: 1, data: report });
});

// Dead Stock Report (Stock=0)
exports.getDeadStockReport = catchAsync(async (req, res) => {
  const { warehouseId } = req.query;

  const whereStock = { quantity: 0 };
  if (warehouseId) whereStock.warehouseId = warehouseId;

  const stocks = await Stock.findAll({
    where: whereStock,
    include: [{ model: Product }, { model: Warehouse }]
  });

  const report = stocks.map(s => ({
    productId: s.productId,
    productName: s.Product.name,
    warehouse: s.Warehouse.name,
    currentStock: s.quantity
  }));

  res.status(200).json({ status: 1, data: report });
});

// Stock Valuation Report (FIFO / LIFO / Average)
exports.getStockValuationReport = catchAsync(async (req, res) => {
  const { warehouseId, method = 'FIFO' } = req.query;
  const whereStock = {};
  if (warehouseId) whereStock.warehouseId = warehouseId;

  const stocks = await Stock.findAll({
    where: whereStock,
    include: [{ model: Product }, { model: Warehouse }]
  });

  const report = stocks.map(s => {
    let value = 0;
    // Simple valuation: use defaultCostPrice as placeholder
    // Can implement FIFO / LIFO / AVG later
    if (method === 'FIFO' || method === 'LIFO' || method === 'AVERAGE') {
      value = s.quantity * s.Product.defaultCostPrice;
    }
    return {
      productId: s.productId,
      productName: s.Product.name,
      warehouse: s.Warehouse.name,
      stockQuantity: s.quantity,
      stockValue: value
    };
  });

  res.status(200).json({ status: 1, data: report });
});

// Fast / Slow Moving Items
exports.getFastSlowMovingItems = catchAsync(async (req, res) => {
  const { startDate, endDate, top = 10 } = req.query;

  const saleItems = await SaleItem.findAll({
    include: [Product],
    where: { createdAt: getDateFilter(startDate, endDate) }
  });

  // Aggregate sales quantity per product
  const productMap = {};
  saleItems.forEach(si => {
    if (!productMap[si.productId]) productMap[si.productId] = { productName: si.Product.name, qty: 0 };
    productMap[si.productId].qty += si.quantity;
  });

  const products = Object.values(productMap);
  const fastMoving = products.sort((a, b) => b.qty - a.qty).slice(0, top);
  const slowMoving = products.sort((a, b) => a.qty - b.qty).slice(0, top);

  res.status(200).json({ status: 1, data: { fastMoving, slowMoving } });
});