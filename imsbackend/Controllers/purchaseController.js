const { Purchase, Supplier, Warehouse, PurchaseItem, Stock } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

const calculateStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};

exports.createPurchase = catchAsync(async (req, res, next) => {
  const { warehouseId, supplierId, totalAmount, paidAmount = 0, paymentMethod, note } = req.body;
  const businessId = getBusinessId();

  if (!warehouseId || !supplierId || !totalAmount) {
    return next(new AppError('Missing required fields', 400));
  }

  if (paidAmount > totalAmount) {
    return next(new AppError('Paid amount cannot exceed total amount', 400));
  }

  const purchase = await Purchase.create({
    businessId,
    warehouseId,
    supplierId,
    totalAmount,
    paidAmount,
    dueAmount: totalAmount - paidAmount,
    paymentMethod,
    status: calculateStatus(totalAmount, paidAmount),
    note,
    isActive: true,
  });

  res.status(201).json({
    status: 1,
    message: 'Purchase created successfully',
    data: purchase,
  });
});

exports.getPurchases = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const businessId = getBusinessId();

  const where = { businessId, isActive: true };
  if (status) where.status = status;

  const purchases = await Purchase.findAndCountAll({
    where,
    include: [Supplier, Warehouse],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    message: 'Purchases fetched successfully',
    total: purchases.count,
    data: purchases.rows,
  });
});

exports.getPurchaseById = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findByPk(req.params.id, {
    include: [Supplier, Warehouse, { model: PurchaseItem }],
  });

  if (!purchase || !purchase.isActive) {
    return next(new AppError('Purchase not found', 404));
  }

  // Remaining amount for items
  const itemsTotal =
    (await PurchaseItem.sum('total', { where: { purchaseId: purchase.id } })) || 0;

  const remainingAmount = purchase.totalAmount - itemsTotal;

  res.status(200).json({
    status: 1,
    message: 'Purchase fetched successfully',
    data: {
      ...purchase.toJSON(),
      itemsTotal,
      remainingAmount,
      isLocked: remainingAmount === 0,
    },
  });
});

exports.updatePurchase = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findByPk(req.params.id);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));

  const { note } = req.body;
  if (note !== undefined) purchase.note = note;
  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase updated successfully',
    data: purchase,
  });
});

exports.deletePurchase = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findByPk(req.params.id);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));

  purchase.isActive = false;
  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase deleted successfully',
  });
});


exports.createPurchaseItem = catchAsync(async (req, res, next) => {
  const { purchaseId, productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = getBusinessId();

  if (!purchaseId || !productId || !warehouseId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }

  if (quantity <= 0 || unitPrice <= 0) return next(new AppError('Invalid quantity/unit price', 400));

  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));

  const itemTotal = quantity * unitPrice;
  const currentItemsTotal =
    (await PurchaseItem.sum('total', { where: { purchaseId } })) || 0;

  if (currentItemsTotal >= purchase.totalAmount)
    return next(new AppError('Purchase is locked, cannot add more items', 400));

  if (currentItemsTotal + itemTotal > purchase.totalAmount)
    return next(new AppError('Purchase item exceeds purchase total amount', 400));

  const item = await PurchaseItem.create({
    purchaseId,
    businessId,
    warehouseId,
    productId,
    quantity,
    unitPrice,
    total: itemTotal,
  });

  // Update purchase financials
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
  await purchase.save();

  // Update stock
  await Stock.create({
    businessId,
    warehouseId,
    productId,
    quantity,
    type: 'IN',
    referenceId: purchaseId,
    note: 'Purchase item added',
  });

  res.status(201).json({
    status: 1,
    message: 'Purchase item added successfully',
    data: item,
  });
});

exports.getPurchaseItems = catchAsync(async (req, res) => {
  const { purchaseId, page = 1, limit = 10 } = req.query;
  const businessId = getBusinessId();
  const where = { businessId };
  if (purchaseId) where.purchaseId = purchaseId;

  const items = await PurchaseItem.findAndCountAll({
    where,
    include: [Product],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    message: 'Purchase items fetched successfully',
    result: items.count,
    data: items.rows,
  });
});

exports.updatePurchaseItem = catchAsync(async (req, res, next) => {
  const item = await PurchaseItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Purchase item not found', 404));

  const purchase = await Purchase.findByPk(item.purchaseId);
  if (purchase.status === 'paid') return next(new AppError('Cannot update item of paid purchase', 400));

  const { quantity, unitPrice } = req.body;
  const oldTotal = item.total;

  if (quantity !== undefined) item.quantity = quantity;
  if (unitPrice !== undefined) item.unitPrice = unitPrice;
  item.total = item.quantity * item.unitPrice;
  await item.save();

  const difference = item.total - oldTotal;
  purchase.totalAmount += difference;
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  await purchase.save();

  // Adjust stock
  if (quantity !== undefined) {
    await Stock.create({
      businessId: purchase.businessId,
      warehouseId: item.warehouseId,
      productId: item.productId,
      quantity: difference,
      type: 'IN',
      referenceId: purchase.id,
      note: 'Purchase item updated',
    });
  }

  res.status(200).json({
    status: 1,
    message: 'Purchase item updated successfully',
    data: item,
  });
});

exports.deletePurchaseItem = catchAsync(async (req, res, next) => {
  const item = await PurchaseItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Purchase item not found', 404));

  const purchase = await Purchase.findByPk(item.purchaseId);
  if (purchase.status === 'paid') return next(new AppError('Cannot delete item of paid purchase', 400));

  // Update purchase financials
  purchase.totalAmount -= item.total;
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  await purchase.save();

  // Update stock
  await Stock.create({
    businessId: purchase.businessId,
    warehouseId: item.warehouseId,
    productId: item.productId,
    quantity: -item.quantity,
    type: 'OUT',
    referenceId: purchase.id,
    note: 'Purchase item deleted',
  });

  await item.destroy();

  res.status(200).json({
    status: 1,
    message: 'Purchase item deleted successfully',
  });
});