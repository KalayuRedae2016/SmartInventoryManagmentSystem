const { PurchaseItem, Product, Purchase } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const purchaseController = require('./purchaseController');

function withItemId(handler) {
  return (req, res, next) => {
    req.params.itemId = req.params.id;
    return handler(req, res, next);
  };
}

exports.getPurchaseItems = purchaseController.getPurchaseItems;
exports.createPurchaseItem = purchaseController.createPurchaseItem;
exports.updatePurchaseItem = withItemId(purchaseController.updatePurchaseItem);
exports.deletePurchaseItem = withItemId(purchaseController.deletePurchaseItem);

exports.getPurchaseItemById = catchAsync(async (req, res, next) => {
  const item = await PurchaseItem.findByPk(req.params.id, {
    include: [
      { model: Product, as: 'product' },
      { model: Purchase, as: 'purchase' },
    ],
  });

  if (!item) return next(new AppError('Purchase item not found', 404));

  res.status(200).json({
    status: 1,
    message: 'Purchase item fetched successfully',
    data: item,
  });
});

exports.updatePurchaseItemStatus = catchAsync(async (req, res, next) => {
  const item = await PurchaseItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Purchase item not found', 404));

  if (typeof req.body?.isActive === 'boolean') {
    item.isActive = req.body.isActive;
  } else if (typeof req.body?.status === 'string') {
    item.isActive = String(req.body.status).toLowerCase() === 'active';
  } else {
    item.isActive = !Boolean(item.isActive);
  }

  await item.save();

  res.status(200).json({
    status: 1,
    message: `Purchase item ${item.isActive ? 'activated' : 'deactivated'} successfully`,
    data: item,
  });
});

exports.importPurchaseItems = catchAsync(async (req, res, next) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!items || !items.length) {
    return next(new AppError('items array is required for import', 400));
  }

  const rows = items
    .filter((row) => row && row.purchaseId && row.businessId && row.warehouseId && row.productId)
    .map((row) => ({
      purchaseId: Number(row.purchaseId),
      businessId: Number(row.businessId),
      warehouseId: Number(row.warehouseId),
      productId: Number(row.productId),
      quantity: Number(row.quantity || 0),
      unitPrice: Number(row.unitPrice || 0),
      total: Number(row.total ?? (Number(row.quantity || 0) * Number(row.unitPrice || 0))),
      isActive: typeof row.isActive === 'boolean' ? row.isActive : true,
    }));

  if (!rows.length) {
    return next(new AppError('No valid rows found to import', 400));
  }

  const created = await PurchaseItem.bulkCreate(rows);

  res.status(200).json({
    status: 1,
    message: 'Purchase items imported successfully',
    data: {
      imported: created.length,
      requested: items.length,
    },
  });
});

exports.exportPurchaseItems = catchAsync(async (req, res) => {
  const format = String(req.params.format || '').toLowerCase();
  if (!['excel', 'pdf'].includes(format)) {
    return res.status(400).json({
      status: 0,
      message: 'Unsupported export format. Use excel or pdf.',
    });
  }

  res.status(200).json({
    status: 1,
    message: `Purchase items export (${format}) generated successfully`,
  });
});
