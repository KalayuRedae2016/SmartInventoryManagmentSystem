const { Purchase, Supplier, Warehouse, PurchaseItem, Stock,StockTransaction } = require('../models');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const purchase = require('../models/purchase');

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
    include: [
      {model: Supplier, as: 'supplier' },
      {model: Warehouse, as: 'warehouse' },      
    ],
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
    include: [
      {model: Supplier, as: 'supplier' },
      {model: Warehouse, as: 'warehouse' },
     { model: PurchaseItem, as: 'items' }
    ],
  });

  if (!purchase)  return next(new AppError('Purchase not found', 404));

  // Remaining amount for items
  const itemsTotal =(await PurchaseItem.sum('total', { where: { purchaseId: purchase.id } })) || 0;

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
  if (!purchase || !purchase.isActive) {
    return next(new AppError('Purchase not found', 404));
  }

  const { warehouseId, supplierId, paymentMethod, totalAmount, paidAmount, note } = req.body;

  // Check if stock already exists
  const stockUsed = await StockTransaction.count({
    where: { referenceType: 'PURCHASE', referenceId: purchase.id }
  });
  const isLocked = stockUsed > 0;

  // Always editable
  if (note !== undefined) purchase.note = note;
  if (paymentMethod !== undefined) purchase.paymentMethod = paymentMethod;

  // Editable only if not locked
  if (!isLocked) {
    if (warehouseId !== undefined) purchase.warehouseId = warehouseId;
    if (supplierId !== undefined) purchase.supplierId = supplierId;
  } else {
    if (warehouseId || supplierId) {
      return next(new AppError('Cannot change warehouse or supplier after stock has been created', 400));
    }
  }

  // Validate totalAmount against items
  if (totalAmount !== undefined) {
    const itemsTotal = (await PurchaseItem.sum('total', { where: { purchaseId: purchase.id } })) || 0;
    if (itemsTotal > totalAmount) {
      return next(
        new AppError(`Cannot set totalAmount to ${totalAmount}. Items already sum up to ${itemsTotal}`, 400)
      );
    }
    purchase.totalAmount = totalAmount;
  }

  // // Validate paidAmount
  // if (paidAmount !== undefined) {
  //   if (paidAmount > purchase.totalAmount) {
  //     return next(new AppError('paidAmount cannot exceed totalAmount', 400));
  //   }
  //   purchase.paidAmount = paidAmount;
  // }
  // purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase updated successfully',
    data: purchase
  });
});

exports.payPurchase = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  const purchase = await Purchase.findByPk(req.params.id);

  if (!purchase) return next(new AppError('Purchase not found', 404));

  if (purchase.paidAmount + amount > purchase.totalAmount) {
    return next(new AppError('Payment exceeds total amount', 400));
  }

  purchase.paidAmount += amount;
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status =
    purchase.paidAmount === purchase.totalAmount
      ? 'paid'
      : 'partial';

  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Payment recorded',
    data: purchase,
  });
});

exports.deletePurchase = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findByPk(req.params.id);
  if (!purchase || !purchase.isActive)
    return next(new AppError('Purchase not found', 404));

  // Optional: Check if stock already created
  const stockUsed = await StockTransaction.count({
    where: { referenceType: 'PURCHASE', referenceId: purchase.id }
  });

  if (stockUsed > 0) {
    return next(new AppError('Cannot delete purchase after stock has been created', 400));
  }

  purchase.isActive = false;
  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase deleted successfully',
  });
});

exports.deletePurchases = catchAsync(async (req, res, next) => {
  const { ids } = req.body; // expect array of purchase IDs
  if (!Array.isArray(ids) || ids.length === 0)
    return next(new AppError('No purchases specified', 400));

  const purchases = await Purchase.findAll({
    where: { id: ids, isActive: true }
  });

  for (const purchase of purchases) {
    const stockUsed = await StockTransaction.count({
      where: { referenceType: 'PURCHASE', referenceId: purchase.id }
    });
    if (stockUsed > 0) continue; // skip locked purchases
    purchase.isActive = false;
    await purchase.save();
  }

  res.status(200).json({
    status: 1,
    message: 'Selected purchases deleted successfully (skipped locked ones)',
  });
});

exports.hardDeletePurchase = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return next(new AppError('Hard delete allowed only in development', 403));
  }

  const purchase = await Purchase.findByPk(req.params.id);
  if (!purchase) return next(new AppError('Purchase not found', 404));

  // Delete related items
  await PurchaseItem.destroy({ where: { purchaseId: purchase.id } });

  // Delete related stock transactions
  await StockTransaction.destroy({ where: { referenceType: 'PURCHASE', referenceId: purchase.id } });

  // Delete the purchase itself
  await purchase.destroy();

  res.status(200).json({
    status: 1,
    message: 'Purchase permanently deleted (hard delete)',
  });
});

exports.hardDeletePurchases = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return next(new AppError('Hard delete allowed only in development', 403));
  }

  const { ids } = req.body; // array of purchase IDs
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new AppError('No purchases specified', 400));
  }

  for (const id of ids) {
    const purchase = await Purchase.findByPk(id);
    if (!purchase) continue;

    await PurchaseItem.destroy({ where: { purchaseId: purchase.id } });
    await StockTransaction.destroy({ where: { referenceType: 'PURCHASE', referenceId: purchase.id } });
    await purchase.destroy();
  }

  res.status(200).json({
    status: 1,
    message: 'Selected purchases permanently deleted (hard delete)',
  });
});


//.....Controller for PurchaseItems.....//.
exports.createPurchaseItem = catchAsync(async (req, res, next) => {
  const { purchaseId, productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = getBusinessId();
  delete req.body.valueDate;


  // 1️⃣ Validate required fields
  if (!purchaseId || !productId || !warehouseId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }
  if (quantity <= 0 || unitPrice <= 0) {
    return next(new AppError('Quantity and unit price must be positive', 400));
  }

  // 2️⃣ Fetch purchase and validate
  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));

  // 3️⃣ Check current total of items
  const itemTotal = quantity * unitPrice;
  const currentItemsTotal = (await PurchaseItem.sum('total', { where: { purchaseId } })) || 0;

  if (currentItemsTotal >= purchase.totalAmount) {
    return next(new AppError('Purchase is locked, total amount already reached', 400));
  }
  if (currentItemsTotal + itemTotal > purchase.totalAmount) {
    return next(new AppError(`Adding this item exceeds purchase total amount (${purchase.totalAmount})`, 400));
  }

  // 4️⃣ Create PurchaseItem
  const item = await PurchaseItem.create({
    purchaseId,
    businessId,
    warehouseId,
    productId,
    quantity,
    unitPrice,
    total: itemTotal,
  });

  // 5️⃣ Update Purchase financials
  // totalAmount is fixed by user input; dueAmount calculated from totalAmount - paidAmount
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
  await purchase.save();

  // 6️⃣ Update stock (IN) and stock transaction
  await Stock.create({
    businessId,
    warehouseId,
    productId,
    quantity,
    type: 'IN',
    referenceId: purchase.id,
    performedBy: req.user?.id || null, // optional
    note: `PurchaseItem added (Purchase ID: ${purchase.id})`,
    valueDate: new Date(),
  });  
  
  await StockTransaction.create({
    businessId,
    warehouseId,
    productId,
    type: 'IN',
    quantity,
    referenceType: 'PURCHASE',
    referenceId: purchase.id,
    performedBy: req.user?.id || null,
    note: `PurchaseItem added (Purchase ID: ${purchase.id})`,
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
  const { quantity, unitPrice, warehouseId, productId } = req.body;
  const businessId = getBusinessId();

  // 1️⃣ Fetch the item
  const item = await PurchaseItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Purchase item not found', 404));

  // 2️⃣ Fetch the related purchase
  const purchase = await Purchase.findByPk(item.purchaseId);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));

  // 3️⃣ Check if stock already exists for this purchase (locked fields)
  const stockUsed = await StockTransaction.count({
    where: { referenceType: 'PURCHASE', referenceId: purchase.id }
  });
  const isLocked = stockUsed > 0;

  // 4️⃣ Validate new values
  let newTotal = item.total;
  if (quantity !== undefined && quantity <= 0) return next(new AppError('Quantity must be positive', 400));
  if (unitPrice !== undefined && unitPrice <= 0) return next(new AppError('Unit price must be positive', 400));

  // 5️⃣ Calculate new item total and ensure totalAmount limit not exceeded
  const newQuantity = quantity !== undefined ? quantity : item.quantity;
  const newUnitPrice = unitPrice !== undefined ? unitPrice : item.unitPrice;
  newTotal = newQuantity * newUnitPrice;

  const otherItemsTotal = (await PurchaseItem.sum('total', {
    where: { purchaseId: purchase.id, id: { [Op.ne]: item.id } }
  })) || 0;

  if (otherItemsTotal + newTotal > purchase.totalAmount) {
    return next(new AppError(`Updating this item exceeds purchase total amount (${purchase.totalAmount})`, 400));
  }

  // 6️⃣ Update editable fields
  if (!isLocked) {
    if (warehouseId !== undefined) item.warehouseId = warehouseId;
    if (productId !== undefined) item.productId = productId;
  } else {
    if (warehouseId || productId) return next(new AppError('Cannot change warehouse or product after stock is created', 400));
  }
  item.quantity = newQuantity;
  item.unitPrice = newUnitPrice;
  item.total = newTotal;

  await item.save();

  // 7️⃣ Update purchase financials
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
  await purchase.save();

  // 8️⃣ Adjust stock and stock transaction
  const diffQuantity = newQuantity - item.quantity; // difference from previous quantity
  if (diffQuantity !== 0) {
    await Stock.create({
      businessId,
      warehouseId: item.warehouseId,
      productId: item.productId,
      quantity: diffQuantity,
      type: 'IN',
      referenceId: purchase.id,
      performedBy: req.user?.id || null,
      note: `PurchaseItem updated (Purchase ID: ${purchase.id})`,
    });

    await StockTransaction.create({
      businessId,
      warehouseId: item.warehouseId,
      productId: item.productId,
      quantity: diffQuantity,
      type: 'IN',
      referenceType: 'PURCHASE',
      referenceId: purchase.id,
      performedBy: req.user?.id || null,
      note: `PurchaseItem updated (Purchase ID: ${purchase.id})`,
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