const { Purchase,Product, Supplier, Warehouse, PurchaseItem, Stock,StockTransaction } = require('../models');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const purchase = require('../models/purchase');
const sequelize = require('../models').sequelize;
const { Op } = require('sequelize');

const getBusinessId = () => 1;

const calculateStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};


const generateInvoiceNumber = () => {
  return 'INV-' + Date.now();
};

const buildPurchaseWhereClause = (user,query) => {
  const {warehouseId,supplierId,minAmount,maxAmount,minPaidAmount,maxPaidAmount,paymentMethod,isActive,startDate,endDate,search} = query;

  let whereQuery = { businessId: user.businessId};

  if (isActive !== undefined) whereQuery.isActive = ["true", "1", true, 1].includes(isActive);
  if(warehouseId) whereQuery.warehouseId=categoryId
  if(supplierId) whereQuery.supplierId=supplierId
  
  // totalAmount price range
  if (minAmount || maxAmount) {
    whereQuery.defaultSellingPrice = {};
    if (minAmount) whereQuery.totalAmount[Op.gte] = Number(minAmount);
    if (maxAmount) whereQuery.totalAmount[Op.lte] = Number(maxAmount);
  }

  // padiAmount range
  if (minPaidAmount || maxPaidAmount) {
    whereQuery.defaultCostPrice = {};
    if (minPaidAmount) whereQuery.paidAmount[Op.gte] = Number(minPaidAmount);
    if (maxPaidAmount) whereQuery.paidAmount[Op.lte] = Number(maxPaidAmount);
  }

  if (startDate && endDate) whereQuery.createdAt = {[Op.between]: [new Date(startDate), new Date(endDate)]};
  if(paymentMethod) whereQuery.paymentMethod=paymentMethod
// Search filter
  if (search) {
    whereQuery[Op.or] = [
      { note: { [Op.like]: `%${search}%` } },
    ];
  }

  return whereQuery;
};

exports.createPurchase = catchAsync(async (req, res, next) => {
  const { warehouseId, supplierId, totalAmount, paidAmount = 0, invoiceNumber, paymentMethod, note } = req.body;
  const businessId = req.user.businessId;

  if (!warehouseId || !supplierId) {
    return next(new AppError("warehouseId and supplierId are required", 400));
  }

  const warehouse = await Warehouse.findByPk(warehouseId);
  if (!warehouse) return next(new AppError('Warehouse not found', 404));

  const supplier = await Supplier.findByPk(supplierId);
  if (!supplier) return next(new AppError('Supplier not found', 404));

  const total = totalAmount && totalAmount > 0 ? totalAmount : 0;

  let invoiceNum = invoiceNumber;
  if (!invoiceNum) {
    invoiceNum = generateInvoiceNumber();
    console.log("inv",invoiceNum)
    const exists = await Purchase.findOne({ where: { invoiceNumber: invoiceNum } });
    if (exists) {
      invoiceNum = `${invoiceNum}-${Date.now()}`; // fallback unique
    }
  }

  if (paidAmount < 0 || paidAmount > total) {
    return next(new AppError('Paid amount cannot be negative or exceed total amount', 400));
  }

  console.log(businessId,warehouseId,supplierId,invoiceNum,total,paidAmount)

  const purchase = await Purchase.create({
    businessId,
    warehouseId,
    supplierId,
    invoiceNumber: invoiceNum,
    totalAmount: total,
    paidAmount,
    dueAmount: total - paidAmount,
    paymentMethod: paymentMethod || 'cash',
    status: calculateStatus(total, paidAmount),
    note,
    isActive: true
  });

  res.status(201).json({
    error: false,
    status: 1,
    message: 'Purchase created successfully',
    data: purchase,
  });
});

exports.getPurchases = catchAsync(async (req, res) => {
  const {page = 1, limit = 10} = req.query;

  const where = buildPurchaseWhereClause(req.user,req.query)

  const purchases = await Purchase.findAndCountAll({
    where,
    include: [
      {model: Supplier, as: 'supplier',attributes:["id","name"] },
      {model: Warehouse, as: 'warehouse',attributes:["id","name"]},  
     { model: PurchaseItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id','name','sku'] }] }   
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
  const purchase = await Purchase.findByPk(req.params.purchaseId, {
    include: [
      { model: Supplier, as: 'supplier' },
      { model: Warehouse, as: 'warehouse' },
      { model: PurchaseItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id','name','sku'] }] }
    ],
  });

  if (!purchase) return next(new AppError('Purchase not found', 404));
  const itemsTotal = (await PurchaseItem.sum('total', { where: { purchaseId: purchase.id } })) || 0;

  const remainingItemAmount = purchase.totalAmount - itemsTotal;
  const unpaidAmount = purchase.totalAmount - purchase.paidAmount;
  const isLocked = remainingItemAmount <= 0 && unpaidAmount <= 0;

  res.status(200).json({
    status: 1,
    message: 'Purchase fetched successfully',
    data: {
      ...purchase.toJSON(),
      itemsTotal,
      remainingItemAmount,
      unpaidAmount,
      status: purchase.status,
      isLocked,
    },
  });
});

exports.updatePurchase = catchAsync(async (req, res, next) => {
   const { warehouseId, supplierId, paymentMethod, totalAmount, note } = req.body;
  const purchase = await Purchase.findByPk(req.params.purchaseId);
  if (!purchase || !purchase.isActive) {
    return next(new AppError('Purchase not found', 404));
  }
 

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

  if (totalAmount !== undefined) {
  const itemsTotal = (await PurchaseItem.sum('total', { where: { purchaseId: purchase.id } })) || 0;
  if (itemsTotal > totalAmount) {
    return next(
      new AppError(`Cannot set totalAmount to ${totalAmount}. Items already sum up to ${itemsTotal}`, 400)
    );
  }
  purchase.totalAmount = totalAmount;
}


  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase updated successfully',
    data: purchase
  });
});

exports.payPurchase = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  const purchase = await Purchase.findByPk(req.params.purchaseId);

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

exports.cancelPurchase = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findByPk(req.params.purchaseId, {
    include: [{ model: PurchaseItem, as: 'items' }]
  });
  if (!purchase || !purchase.isActive)
    return next(new AppError('Purchase not found or already canceled', 404));

  const businessId = purchase.businessId;

  for (const item of purchase.items) {
    const stock = await Stock.findOne({
      where: { businessId, warehouseId: item.warehouseId, productId: item.productId }
    });
    if (stock) {
      stock.quantity -= item.quantity;
      if (stock.quantity < 0) stock.quantity = 0; // prevent negative stock
      await stock.save();
    }

    // Record stock transaction
    await StockTransaction.create({
      businessId,
      warehouseId: item.warehouseId,
      productId: item.productId,
      quantity: item.quantity,
      type: 'OUT',
      referenceType: 'PURCHASE',
      referenceId: purchase.id,
      performedBy: req.user?.id || null,
      note: `Purchase canceled (Purchase ID: ${purchase.id})`,
      valueDate: new Date(),
    });
  }

  purchase.isActive = false;
  purchase.status = 'cancelled';
  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase canceled successfully',
    data: {
      id: purchase.id,
      invoiceNumber: purchase.invoiceNumber,
      status: purchase.status,
      isActive: purchase.isActive
    }
  });
});

exports.cancelPurchases = catchAsync(async (req, res, next) => {
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

exports.deletePurchase = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return next(new AppError('Hard delete allowed only in development', 403));
  }

  const purchase = await Purchase.findByPk(req.params.purchaseId);
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

exports.deletePurchases = catchAsync(async (req, res, next) => {
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
exports.addPurchaseItem = catchAsync(async (req, res, next) => {
   const purchaseId = Number(req.params.purchaseId);
  const {productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = req.user.businessId

  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));

  if (!productId || !warehouseId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }

  if (quantity <= 0 || unitPrice <= 0) {
    return next(new AppError('Quantity and unit price must be positive', 400));
  }

  
  const itemTotal = quantity * unitPrice;
  const currentItemsTotal = await PurchaseItem.sum('total', { where: { purchaseId } })|| 0;

  if (currentItemsTotal + itemTotal > purchase.totalAmount) {
    return next( new AppError(`Adding item :${itemTotal} to ${currentItemsTotal} exceeds purchase total amount:${purchase.totalAmount}`, 400));
  }

  // TRANSACTION START
  const t = await sequelize.transaction();

  try {
    const item = await PurchaseItem.create(
      {
        businessId,
        warehouseId: resolvedWarehouseId,
        productId,
        purchaseId,
        quantity,
        unitPrice,
        total: itemTotal,
      },
      { transaction: t }
    );

    purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
    purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
    await purchase.save({ transaction: t });

    const [stock] = await Stock.findOrCreate({
      where: { businessId, warehouseId: resolvedWarehouseId, productId },
      defaults: { quantity: 0 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    stock.quantity += quantity;
    await stock.save({ transaction: t });

    // 4️⃣ Insert StockTransaction (history)
    await StockTransaction.create(
      {
        businessId,
        warehouseId: resolvedWarehouseId,
        productId,
        type: 'IN',
        quantity,
        referenceType: 'PURCHASE',
        referenceId: purchase.id,
        performedBy: req.user?.id || null,
        note: `PurchaseItem added (Purchase ID: ${purchase.id})`,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      status: 1,
      message: 'Purchase item added successfully',
      data: item,
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.getPurchaseItems = catchAsync(async (req, res) => {
  const { purchaseId, isActive, page = 1, limit = 10 } = req.query;
  const businessId = getBusinessId();
  const where = { businessId };
  if (purchaseId) where.purchaseId = purchaseId;
  if (isActive !== undefined) where.isActive = ['true', '1', true, 1].includes(isActive);

  const items = await PurchaseItem.findAndCountAll({
    where,
    include: [
       {model: Product, as: 'product' },
       {model: Purchase, as: 'purchase' },
    ],
    
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

  const businessId = req.user.businessId
  const purchaseId=req.params.purchaseId

   const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));

  const item = await PurchaseItem.findByPk(req.params.itemId);
  if (!item) return next(new AppError('Purchase item not found', 404));

  const stockUsed = await StockTransaction.count({
    where: { referenceType: 'PURCHASE', referenceId: purchase.id }
  });
  const isLocked = stockUsed > 0;

  let newQuantity = quantity !== undefined ? quantity : item.quantity;
  let newUnitPrice = unitPrice !== undefined ? unitPrice : item.unitPrice;
  if (newQuantity <= 0) return next(new AppError('Quantity must be positive', 400));
  if (newUnitPrice <= 0) return next(new AppError('Unit price must be positive', 400));

  const newTotal = newQuantity * newUnitPrice;

  const otherItemsTotal = (await PurchaseItem.sum('total', {
    where: { purchaseId: purchase.id, id: { [Op.ne]: item.id } }
  })) || 0;

  if (otherItemsTotal + newTotal > purchase.totalAmount) {
    return next(new AppError(`Updating this item exceeds purchase total amount (${purchase.totalAmount})`, 400));
  }

  if (!isLocked) {
    item.warehouseId = purchase.warehouseId;
    if (productId !== undefined) item.productId = productId;
  } else {
    if (warehouseId || productId) return next(new AppError('Cannot change warehouse or product after stock is created', 400));
  }

  const diffQuantity = newQuantity - item.quantity;

  item.quantity = newQuantity;
  item.unitPrice = newUnitPrice;
  item.total = newTotal;
  await item.save();

  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
  await purchase.save();

  if (diffQuantity !== 0) {
    let stock = await Stock.findOne({
      where: { businessId, warehouseId: item.warehouseId, productId: item.productId }
    });
    if (stock) {
      stock.quantity += diffQuantity;
      await stock.save();
    } else {
      await Stock.create({
        businessId,
        warehouseId: item.warehouseId,
        productId: item.productId,
        quantity: diffQuantity,
        name: '', // optional
        stockAlert: 0,
        description: 'Stock from updated purchase item',
      });
    }

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
      valueDate: new Date(),
    });
  }

  res.status(200).json({
    status: 1,
    message: 'Purchase item updated successfully',
    data: item,
  });
});

exports.deletePurchaseItem = catchAsync(async (req, res, next) => {
  const item = await PurchaseItem.findByPk(req.params.itemId);
  if (!item) return next(new AppError('Purchase item not found', 404));

  const purchase = await Purchase.findByPk(item.purchaseId);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));
  if (purchase.status === 'paid') return next(new AppError('Cannot delete item of paid purchase', 400));

  const businessId = purchase.businessId;

  // 1️⃣ Adjust stock
  const stock = await Stock.findOne({
    where: { businessId, warehouseId: item.warehouseId, productId: item.productId }
  });

  if (stock) {
    stock.quantity -= item.quantity;
    if (stock.quantity < 0) stock.quantity = 0; // prevent negative stock
    await stock.save();
  }

  // 2️⃣ Record StockTransaction
  await StockTransaction.create({
    businessId,
    warehouseId: item.warehouseId,
    productId: item.productId,
    quantity: item.quantity,
    type: 'OUT',
    referenceType: 'PURCHASE',
    referenceId: purchase.id,
    performedBy: req.user?.id || null,
    note: `PurchaseItem deleted (Purchase ID: ${purchase.id})`,
    valueDate: new Date(),
  });

  // 3️⃣ Delete the PurchaseItem
  await item.destroy();

  // 4️⃣ Update purchase financials (do NOT reduce totalAmount)
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase item deleted successfully',
  });
});

exports.deleteAllPurchaseItems = catchAsync(async (req, res, next) => {
  // 1️⃣ Fetch all active purchases
  const purchases = await Purchase.findAll({ where: { isActive: true } });
  if (!purchases.length) return next(new AppError('No active purchases found', 404));

  for (const purchase of purchases) {
    // Skip fully paid purchases
    if (purchase.status === 'paid') continue;

    const purchaseItems = await PurchaseItem.findAll({ where: { purchaseId: purchase.id } });

    for (const item of purchaseItems) {
      // Adjust stock
      const stock = await Stock.findOne({
        where: { businessId: purchase.businessId, warehouseId: item.warehouseId, productId: item.productId }
      });
      if (stock) {
        stock.quantity -= item.quantity;
        if (stock.quantity < 0) stock.quantity = 0;
        await stock.save();
      }

      // Record stock transaction
      await StockTransaction.create({
        businessId: purchase.businessId,
        warehouseId: item.warehouseId,
        productId: item.productId,
        quantity: item.quantity,
        type: 'OUT',
        referenceType: 'PURCHASE',
        referenceId: purchase.id,
        performedBy: req.user?.id || null,
        note: `PurchaseItem deleted (Purchase ID: ${purchase.id})`,
        valueDate: new Date(),
      });

      // Delete purchase item
      await item.destroy();
    }

    // Soft delete the purchase
    purchase.isActive = false;
    await purchase.save();
  }

  res.status(200).json({
    status: 1,
    message: 'All eligible purchases deleted successfully',
  });
});
