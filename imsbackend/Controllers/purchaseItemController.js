const { PurchaseItem, Purchase, Product, sequelize } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1; // Replace with req.user.businessId in real system

const calculateStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};


exports.createPurchaseItem = catchAsync(async (req, res, next) => {
  const { purchaseId, productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = getBusinessId();

  if (!purchaseId || !warehouseId || !productId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }

  if (quantity <= 0 || unitPrice <= 0) {
    return next(new AppError('Invalid quantity or unit price', 400));
  }

  // Transaction ensures data integrity
  await sequelize.transaction(async (t) => {
    const purchase = await Purchase.findByPk(purchaseId, { transaction: t });
    if (!purchase || !purchase.isActive) {
      throw new AppError('Purchase not found', 404);
    }

    const itemTotal = quantity * unitPrice;

    // Current total of all items
    const currentItemsTotal =
      (await PurchaseItem.sum('total', { where: { purchaseId }, transaction: t })) || 0;

    // LOCK adding items if total reached
    if (currentItemsTotal >= purchase.totalAmount) {
      throw new AppError('Purchase has reached its total amount and is locked', 400);
    }

    // Prevent overflow
    if (currentItemsTotal + itemTotal > purchase.totalAmount) {
      throw new AppError('Purchase item total exceeds purchase total amount', 400);
    }

    // Create item
    const item = await PurchaseItem.create(
      { purchaseId, businessId, warehouseId, productId, quantity, unitPrice, total: itemTotal },
      { transaction: t }
    );

    // Update financial state
    purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
    purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
    await purchase.save({ transaction: t });

    res.status(201).json({
      status: 1,
      message: 'Purchase item added successfully',
      data: item,
    });
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

exports.getPurchaseItemById = catchAsync(async (req, res, next) => {
  const item = await PurchaseItem.findOne({
    where: { id: req.params.purchaseItemId, businessId: getBusinessId() },
    include: [
      Product,
      {
        model: Purchase,
        include: ['Supplier', 'Warehouse'],
      },
    ],
  });

  if (!item) return next(new AppError('Purchase item not found', 404));

  // Calculate remainingAmount dynamically
  const itemsTotal =
    (await PurchaseItem.sum('total', { where: { purchaseId: item.purchaseId } })) || 0;
  const purchase = item.Purchase;
  const remainingAmount = purchase.totalAmount - itemsTotal;

  res.status(200).json({
    status: 1,
    message: 'Purchase item fetched successfully',
    data: {
      ...item.toJSON(),
      remainingAmount,
      isLocked: remainingAmount === 0,
    },
  });
});

exports.updatePurchaseItem = catchAsync(async (req, res, next) => {
  const { quantity, unitPrice } = req.body;

  await sequelize.transaction(async (t) => {
    const item = await PurchaseItem.findByPk(req.params.id, { transaction: t });
    if (!item) throw new AppError('Purchase item not found', 404);

    const purchase = await Purchase.findByPk(item.purchaseId, { transaction: t });
    if (purchase.status === 'paid') {
      throw new AppError('Cannot update items of a paid purchase', 400);
    }

    if (quantity !== undefined && quantity <= 0) throw new AppError('Invalid quantity', 400);
    if (unitPrice !== undefined && unitPrice <= 0) throw new AppError('Invalid unit price', 400);

    const oldTotal = item.total;
    if (quantity !== undefined) item.quantity = quantity;
    if (unitPrice !== undefined) item.unitPrice = unitPrice;

    item.total = item.quantity * item.unitPrice;

    // Ensure totalAmount not exceeded
    const itemsTotalExcludingCurrent =
      (await PurchaseItem.sum('total', {
        where: { purchaseId: item.purchaseId, id: { [Op.ne]: item.id } },
        transaction: t,
      })) || 0;

    if (itemsTotalExcludingCurrent + item.total > purchase.totalAmount) {
      throw new AppError('Updated item exceeds purchase total amount', 400);
    }

    await item.save({ transaction: t });

    // Update purchase financials
    purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
    purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
    await purchase.save({ transaction: t });

    res.status(200).json({
      status: 1,
      message: 'Purchase item updated successfully',
      data: item,
    });
  });
});

exports.deletePurchaseItem = catchAsync(async (req, res, next) => {
  await sequelize.transaction(async (t) => {
    const item = await PurchaseItem.findByPk(req.params.id, { transaction: t });
    if (!item) throw new AppError('Purchase item not found', 404);

    const purchase = await Purchase.findByPk(item.purchaseId, { transaction: t });
    if (purchase.status === 'paid') throw new AppError('Cannot delete items from a paid purchase', 400);

    await item.destroy({ transaction: t });

    // Recalculate purchase financials
    const itemsTotal =
      (await PurchaseItem.sum('total', { where: { purchaseId: purchase.id }, transaction: t })) || 0;
    purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
    await purchase.save({ transaction: t });

    res.status(200).json({
      status: 1,
      message: 'Purchase item deleted successfully',
    });
  });
});

exports.deleteAllPurchaseItem = catchAsync(async (req, res, next) => {
  const { purchaseId } = req.body;

  await sequelize.transaction(async (t) => {
    const purchase = await Purchase.findByPk(purchaseId, { transaction: t });
    if (!purchase || !purchase.isActive) throw new AppError('Purchase not found', 404);
    if (purchase.status === 'paid') throw new AppError('Cannot delete items from a paid purchase', 400);

    await PurchaseItem.destroy({ where: { purchaseId }, transaction: t });

    // Reset financial state
    purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
    await purchase.save({ transaction: t });

    res.status(200).json({
      status: 1,
      message: 'All purchase items deleted successfully',
    });
  });
});
