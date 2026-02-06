const { SaleReturn, SaleReturnItem, Sale, Product, Customer,Warehouse, Stock } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

const getBusinessId = () => 1;

const calculateStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};

// Create a sale return
exports.createSaleReturn = catchAsync(async (req, res, next) => {
  const {warehouseId,customerId,saleId,totalAmount,paidAmount = 0,paymentMethod,note,returnDate} = req.body;

  const businessId = getBusinessId();

  if (!saleId || !warehouseId || !customerId || totalAmount <= 0 || paidAmount < 0 || paidAmount > totalAmount || !paymentMethod)
    return next(new AppError('Missing or invalid required fields', 400));

  const sale = await Sale.findByPk(saleId);
  if (!sale || !sale.isActive)  return next(new AppError('Original sale not found', 404));

  const saleReturn = await SaleReturn.create({
    businessId,
    warehouseId,
    saleId,
    customerId,
    totalAmount,
    paidAmount,
    dueAmount: totalAmount - paidAmount,
    paymentMethod,
    status: calculateStatus(totalAmount, paidAmount),
    note,
    returnDate: returnDate || new Date(),
    isActive: true
  });

  res.status(201).json({
    status: 1,
    message: 'Sale return created successfully. Add return items next.',
    data: saleReturn
  });
});

// Get all sale returns (safe for hasMany)
exports.getSaleReturns = catchAsync(async (req, res) => {
  const {page = 1,limit = 10,saleId,customerId,warehouseId,status,fromDate,toDate,isActive } = req.query;

  const businessId = getBusinessId();

  const where = {
    businessId,
    ...(saleId && { saleId }),
    ...(customerId && { customerId }),
    ...(warehouseId && { warehouseId }),
    ...(status && { status }),
    ...(isActive !== undefined && { isActive }),
    ...(fromDate || toDate
      ? { returnDate: { ...(fromDate && { [Op.gte]: new Date(fromDate) }), ...(toDate && { [Op.lte]: new Date(toDate) }) } }
      : {})
  };

  const total = await SaleReturn.count({ where });
  const rows = await SaleReturn.findAll({
    where,
    include: [
      { model: Sale, as: 'sale', attributes: ['id', 'invoiceNumber', 'saleDate'] },
      { model: Customer, as: 'customer', attributes: ['id', 'name'] },
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
      { model: SaleReturnItem, as: 'items' } 
    ],
    limit: Number(limit),
    offset: (page - 1) * limit,
    order: [['returnDate', 'DESC']]
  });

  res.status(200).json({
    status: 1,
    result: total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: rows
  });
});

// Get sale return by ID
exports.getSaleReturn= catchAsync(async (req, res, next) => {

  const saleReturn = await SaleReturn.findByPk(req.params.id, {
    include: [
      { model: Sale, as: 'sale' },
      { model: Customer, as: 'customer' },
      { model: Warehouse, as: 'warehouse' },
      { model: SaleReturnItem, as: 'items' }
    ],
    });

  if (!saleReturn) return next(new AppError('Sale return not found', 404));

  res.status(200).json({
    status: 1,
    message: 'Sale return retrieved successfully',
    data: saleReturn,
  });
});

// Update sale return (only pending)
exports.updateSaleReturn = catchAsync(async (req, res, next) => {
  const saleReturn = await SaleReturn.findByPk(req.params.id);
  if (!saleReturn) return next(new AppError('Sale return not found', 404));
  if (saleReturn.status) return next(new AppError('Cannot update a completed return', 400));

  const { warehouseId, customerId, paymentMethod, returnDate } = req.body;
  if (warehouseId) saleReturn.warehouseId = warehouseId;
  if (customerId) saleReturn.customerId = customerId;
  if (paymentMethod) saleReturn.paymentMethod = paymentMethod;
  if (returnDate) saleReturn.returnDate = returnDate;

  await saleReturn.save();

  res.status(200).json({
    status: 1,
    message: 'Sale return updated successfully',
    data: saleReturn,
  });
});

// Delete sale return (only pending)
exports.deleteSaleReturn = catchAsync(async (req, res, next) => {
  const saleReturn = await SaleReturn.findByPk(req.params.id, { include: [SaleReturnItem] });
  if (!saleReturn) return next(new AppError('Sale return not found', 404));
  if (saleReturn.status) return next(new AppError('Cannot delete a completed return', 400));

  // Revert stock for all items
  for (const item of saleReturn.SaleReturnItems) {
    await Stock.create({
      businessId: saleReturn.businessId,
      warehouseId: saleReturn.warehouseId,
      productId: item.productId,
      quantity: -item.quantity, // revert IN stock
      type: 'ADJUST',
      referenceId: saleReturn.id,
      note: 'Sale return deletion revert',
    });
    await item.destroy();
  }

  await saleReturn.destroy();

  res.status(200).json({
    status: 1,
    message: 'Sale return deleted successfully',
  });
});

// Add a sale return item
exports.createSaleReturnItem = catchAsync(async (req, res, next) => {
  const { saleReturnId, productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = getBusinessId();

  if (!saleReturnId || !productId || !warehouseId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }
  if (quantity <= 0 || unitPrice <= 0) return next(new AppError('Invalid quantity or unitPrice', 400));

  const saleReturn = await SaleReturn.findByPk(saleReturnId);
  if (!saleReturn) return next(new AppError('Sale return not found', 404));
  if (saleReturn.status) return next(new AppError('Cannot add items to a completed return', 400));

  // Prevent returning more than sold quantity
  const saleItem = await SaleItem.findOne({
    where: { saleId: saleReturn.saleId, productId }
  });
  if (!saleItem) return next(new AppError('Product not in original sale', 400));

  const alreadyReturned = await SaleReturnItem.sum('quantity', {
    where: { saleReturnId: saleReturn.id, productId }
  }) || 0;

  if (quantity + alreadyReturned > saleItem.quantity) {
    return next(new AppError('Return quantity exceeds sold quantity', 400));
  }

  const total = quantity * unitPrice;

  const item = await SaleReturnItem.create({
    saleReturnId,
    businessId,
    warehouseId,
    productId,
    quantity,
    unitPrice,
    total,
  });

  // Update stock IN
  await Stock.create({
    businessId,
    warehouseId,
    productId,
    quantity,
    type: 'IN',
    referenceId: saleReturnId,
    note: 'Sale return added',
  });

  // Update saleReturn totalAmount
  saleReturn.totalAmount = await SaleReturnItem.sum('total', { where: { saleReturnId } }) || 0;
  await saleReturn.save();

  res.status(201).json({
    status: 1,
    message: 'Sale return item added successfully',
    data: item,
  });
});

// Update sale return item
exports.updateSaleReturnItem = catchAsync(async (req, res, next) => {
  const item = await SaleReturnItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Sale return item not found', 404));

  const saleReturn = await SaleReturn.findByPk(item.saleReturnId);
  if (saleReturn.status) return next(new AppError('Cannot update item of completed return', 400));

  const { quantity, unitPrice } = req.body;
  if (quantity !== undefined) item.quantity = quantity;
  if (unitPrice !== undefined) item.unitPrice = unitPrice;

  item.total = item.quantity * item.unitPrice;
  await item.save();

  // Update saleReturn totalAmount
  saleReturn.totalAmount = await SaleReturnItem.sum('total', { where: { saleReturnId: saleReturn.id } }) || 0;
  await saleReturn.save();

  res.status(200).json({
    status: 1,
    message: 'Sale return item updated successfully',
    data: item,
  });
});

// Delete sale return item
exports.deleteSaleReturnItem = catchAsync(async (req, res, next) => {
  const item = await SaleReturnItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Sale return item not found', 404));

  const saleReturn = await SaleReturn.findByPk(item.saleReturnId);
  if (saleReturn.status) return next(new AppError('Cannot delete item of completed return', 400));

  // Update stock
  await Stock.create({
    businessId: saleReturn.businessId,
    warehouseId: item.warehouseId,
    productId: item.productId,
    quantity: -item.quantity,
    type: 'ADJUST',
    referenceId: saleReturn.id,
    note: 'Sale return item deleted',
  });

  await item.destroy();

  // Update saleReturn totalAmount
  saleReturn.totalAmount = await SaleReturnItem.sum('total', { where: { saleReturnId: saleReturn.id } }) || 0;
  await saleReturn.save();

  res.status(200).json({
    status: 1,
    message: 'Sale return item deleted successfully',
  });
});
