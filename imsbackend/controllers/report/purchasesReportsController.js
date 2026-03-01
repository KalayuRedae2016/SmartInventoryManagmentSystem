const { Purchase, PurchaseItem, PurchaseReturn, PurchaseReturnItem, Supplier, Warehouse, Product, User } = require('../../models');
const catchAsync = require('../../utils/catchAsync');
const { Op } = require('sequelize');

const getDateFilter = (startDate, endDate) => {
  if (startDate && endDate) return { [Op.between]: [new Date(startDate), new Date(endDate)] };
  return {};
};

/**
 * 1️⃣ Purchase Summary Report
 */
exports.summary = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = getDateFilter(startDate, endDate);
  if (warehouseId) where.warehouseId = warehouseId;

  const purchases = await Purchase.findAll({ where });

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDue = totalAmount - totalPaid;

  res.status(200).json({
    status: 1,
    data: { totalPurchases, totalAmount, totalPaid, totalDue }
  });
});

/**
 * 2️⃣ Purchase Detailed Report
 */
exports.detailed = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId, supplierId } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = getDateFilter(startDate, endDate);
  if (warehouseId) where.warehouseId = warehouseId;
  if (supplierId) where.supplierId = supplierId;

  const purchases = await Purchase.findAll({
    where,
    include: [
      { model: Supplier, attributes: ['id', 'name', 'phone', 'email'] },
      { model: Warehouse, attributes: ['id', 'name'] },
      { model: PurchaseItem, include: [{ model: Product, attributes: ['id', 'name', 'code', 'cost'] }] }
    ]
  });

  const data = purchases.map(p => ({
    purchaseId: p.id,
    date: p.createdAt,
    warehouse: p.Warehouse.name,
    supplier: p.Supplier.name,
    totalAmount: p.totalAmount,
    paid: p.paidAmount,
    due: p.dueAmount,
    items: p.PurchaseItems.map(i => ({
      productId: i.Product.id,
      productName: i.Product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
      cost: i.Product.cost
    }))
  }));

  res.status(200).json({ status: 1, data });
});

/**
 * 3️⃣ Purchase By Supplier
 */
exports.bySupplier = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const suppliers = await Supplier.findAll({
    include: [{
      model: Purchase,
      where: { createdAt: getDateFilter(startDate, endDate) },
      required: false
    }]
  });

  const data = suppliers.map(s => {
    const totalAmount = s.Purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPaid = s.Purchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalDue = totalAmount - totalPaid;
    return {
      supplierId: s.id,
      name: s.name,
      totalPurchases: s.Purchases.length,
      totalAmount,
      totalPaid,
      totalDue
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  res.status(200).json({ status: 1, data });
});

/**
 * 4️⃣ Purchase Returns Report
 */
exports.returns = catchAsync(async (req, res) => {
  const { startDate, endDate, warehouseId } = req.query;

  const where = {};
  if (startDate && endDate) where.createdAt = getDateFilter(startDate, endDate);
  if (warehouseId) where.warehouseId = warehouseId;

  const returns = await PurchaseReturn.findAll({
    where,
    include: [
      { model: Supplier, attributes: ['id', 'name'] },
      { model: PurchaseReturnItem, include: [{ model: Product, attributes: ['id', 'name', 'code'] }] }
    ]
  });

  const data = returns.map(r => ({
    returnId: r.id,
    supplier: r.Supplier.name,
    totalAmount: r.totalAmount,
    items: r.PurchaseReturnItems.map(i => ({
      productId: i.Product.id,
      productName: i.Product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total
    }))
  }));

  res.status(200).json({ status: 1, data });
});

/**
 * 5️⃣ Top Suppliers (by purchase amount)
 */
exports.topSuppliers = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const suppliers = await Supplier.findAll({
    include: [{
      model: Purchase,
      where: { createdAt: getDateFilter(startDate, endDate) },
      required: false
    }]
  });

  const report = suppliers.map(s => {
    const totalAmount = s.Purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    return { supplierId: s.id, name: s.name, totalPurchases: s.Purchases.length, totalAmount };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  res.status(200).json({ status: 1, data: report });
});