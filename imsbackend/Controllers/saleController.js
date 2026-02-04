const { Sale, SaleItem, Product, Customer, User, Stock } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

// Calculate sale status
const calculateSaleStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};

/**
 * =========================
 * SALE CONTROLLER
 * =========================
 */

// Create a new sale
exports.createSale = catchAsync(async (req, res, next) => {
  const { warehouseId, customerId, invoiceNumber, saleDate, paymentMethod } = req.body;
  const businessId = getBusinessId();

  if (!warehouseId || !customerId || !invoiceNumber || !saleDate) {
    return next(new AppError('Missing required fields', 400));
  }

  const sale = await Sale.create({
    businessId,
    warehouseId,
    customerId,
    invoiceNumber,
    saleDate,
    totalAmount: 0, // will calculate after adding items
    paymentMethod,
    status: false, // unpaid
    due: 0,
  });

  res.status(201).json({
    status: 1,
    message: 'Sale created successfully. Now add sale items.',
    data: sale,
  });
});

// Get all sales
exports.getSales = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, customerId, status } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (customerId) where.customerId = customerId;
  if (status !== undefined) where.status = status;

  const sales = await Sale.findAndCountAll({
    where,
    include: [Customer, User],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['saleDate', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: sales.count,
    data: sales.rows,
  });
});

// Get sale by id
exports.getSaleById = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [
      Customer,
      User,
      { model: SaleItem, include: [Product] }
    ]
  });

  if (!sale) return next(new AppError('Sale not found', 404));

  // Calculate items total and remaining due
  const itemsTotal = await SaleItem.sum('total', { where: { saleId: sale.id } }) || 0;
  const remainingDue = sale.totalAmount - (sale.totalAmount - sale.due);

  res.status(200).json({
    status: 1,
    data: {
      ...sale.toJSON(),
      itemsTotal,
      remainingDue,
      isLocked: sale.status === 'paid'
    },
  });
});

// Update sale (only if not paid)
exports.updateSale = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.id);
  if (!sale) return next(new AppError('Sale not found', 404));
  if (sale.status) return next(new AppError('Cannot update a paid sale', 400));

  const { customerId, warehouseId, paymentMethod, saleDate } = req.body;
  if (customerId) sale.customerId = customerId;
  if (warehouseId) sale.warehouseId = warehouseId;
  if (paymentMethod) sale.paymentMethod = paymentMethod;
  if (saleDate) sale.saleDate = saleDate;

  await sale.save();

  res.status(200).json({
    status: 1,
    message: 'Sale updated successfully',
    data: sale,
  });
});

// Delete sale (only if not paid)
exports.deleteSale = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.id);
  if (!sale) return next(new AppError('Sale not found', 404));
  if (sale.status) return next(new AppError('Cannot delete a paid sale', 400));

  // Revert stock for all items
  const saleItems = await SaleItem.findAll({ where: { saleId: sale.id } });
  for (const item of saleItems) {
    await Stock.create({
      businessId: sale.businessId,
      warehouseId: sale.warehouseId,
      productId: item.productId,
      quantity: item.quantity,
      type: 'ADJUST',
      referenceId: sale.id,
      note: 'Sale deletion revert',
    });
    await item.destroy();
  }

  await sale.destroy();

  res.status(200).json({
    status: 1,
    message: 'Sale deleted successfully',
  });
});


/**
 * =========================
 * SALE ITEM CONTROLLER
 * =========================
 */

// Add sale item
exports.createSaleItem = catchAsync(async (req, res, next) => {
  const { saleId, productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = getBusinessId();

  if (!saleId || !productId || !warehouseId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }
  if (quantity <= 0 || unitPrice <= 0) return next(new AppError('Invalid quantity or unitPrice', 400));

  const sale = await Sale.findByPk(saleId);
  if (!sale) return next(new AppError('Sale not found', 404));
  if (sale.status) return next(new AppError('Cannot add items to a paid sale', 400));

  const total = quantity * unitPrice;
  const currentItemsTotal = await SaleItem.sum('total', { where: { saleId } }) || 0;

  // Lock if already reached total
  if (currentItemsTotal >= sale.totalAmount && sale.totalAmount > 0)
    return next(new AppError('Sale items already finalized', 400));

  // Create item
  const item = await SaleItem.create({
    saleId,
    businessId,
    warehouseId,
    productId,
    quantity,
    unitPrice,
    total,
  });

  // Update sale financials
  sale.totalAmount = currentItemsTotal + total;
  sale.due = sale.totalAmount;
  sale.status = false; // unpaid
  await sale.save();

  // Stock OUT
  await Stock.create({
    businessId,
    warehouseId,
    productId,
    quantity,
    type: 'OUT',
    referenceId: saleId,
    note: `Sale ${sale.invoiceNumber} item added`,
  });

  res.status(201).json({
    status: 1,
    message: 'Sale item added successfully',
    data: item,
  });
});

// Update sale item
exports.updateSaleItem = catchAsync(async (req, res, next) => {
  const item = await SaleItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Sale item not found', 404));

  const sale = await Sale.findByPk(item.saleId);
  if (sale.status) return next(new AppError('Cannot update item of paid sale', 400));

  const { quantity, unitPrice } = req.body;
  const oldTotal = item.total;

  if (quantity !== undefined) item.quantity = quantity;
  if (unitPrice !== undefined) item.unitPrice = unitPrice;

  item.total = item.quantity * item.unitPrice;
  await item.save();

  // Update sale financials
  sale.totalAmount = (await SaleItem.sum('total', { where: { saleId: sale.id } })) || 0;
  sale.due = sale.totalAmount;
  sale.status = false;
  await sale.save();

  // Adjust stock
  const difference = item.total - oldTotal;
  if (difference !== 0) {
    await Stock.create({
      businessId: sale.businessId,
      warehouseId: item.warehouseId,
      productId: item.productId,
      quantity: difference,
      type: difference > 0 ? 'OUT' : 'ADJUST',
      referenceId: sale.id,
      note: 'Sale item updated',
    });
  }

  res.status(200).json({
    status: 1,
    message: 'Sale item updated successfully',
    data: item,
  });
});

// Delete sale item
exports.deleteSaleItem = catchAsync(async (req, res, next) => {
  const item = await SaleItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Sale item not found', 404));

  const sale = await Sale.findByPk(item.saleId);
  if (sale.status) return next(new AppError('Cannot delete item of paid sale', 400));

  // Update sale financials
  sale.totalAmount -= item.total;
  sale.due = sale.totalAmount;
  await sale.save();

  // Update stock
  await Stock.create({
    businessId: sale.businessId,
    warehouseId: item.warehouseId,
    productId: item.productId,
    quantity: -item.quantity,
    type: 'ADJUST',
    referenceId: sale.id,
    note: 'Sale item deleted',
  });

  await item.destroy();

  res.status(200).json({
    status: 1,
    message: 'Sale item deleted successfully',
  });
});
