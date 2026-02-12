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

exports.createSaleReturn = catchAsync(async (req, res, next) => {
  const {warehouseId,saleId,customerId,paidAmount = 0,paymentMethod,note,returnDate} = req.body;

  const businessId = getBusinessId();

  // ✅ One-line validation
  if (!warehouseId || !saleId || !customerId || !paymentMethod || paidAmount < 0)
    return next(new AppError('Invalid or missing required fields', 400));

  const sale = await Sale.findByPk(saleId);
  if (!sale) return next(new AppError('Sale not found', 404));

  const saleReturn = await SaleReturn.create({
    businessId,
    warehouseId,
    saleId,
    customerId,
    totalAmount: 0,
    paidAmount,
    dueAmount: 0 - paidAmount,
    paymentMethod,
    status: calculateStatus(0, paidAmount),
    note,
    returnDate: returnDate || new Date()
  });

  res.status(201).json({
    status: 1,
    message: 'Sale return created. Add return items.',
    data: saleReturn
  });
});

exports.addSaleReturnItem = catchAsync(async (req, res, next) => {
  const { saleReturnId, productId, quantity, unitPrice } = req.body;
  const businessId = getBusinessId();

  if (![saleReturnId, productId, quantity, unitPrice].every(Boolean) || quantity <= 0)
    return next(new AppError('Invalid item data', 400));

  await sequelize.transaction(async (t) => {
    const saleReturn = await SaleReturn.findByPk(saleReturnId, { transaction: t });
    if (!saleReturn) throw new AppError('Sale return not found', 404);
    if (saleReturn.status === 'paid')
      throw new AppError('Paid sale return cannot be modified', 400);

    // 🔒 Prevent returning more than sold
    const saleItem = await SaleItem.findOne({
      where: { saleId: saleReturn.saleId, productId },
      transaction: t
    });
    if (!saleItem) throw new AppError('Product not in original sale', 400);

    const alreadyReturned =
      (await SaleReturnItem.sum('quantity', {
        where: { saleReturnId, productId },
        transaction: t
      })) || 0;

    if (alreadyReturned + quantity > saleItem.quantity)
      throw new AppError('Return quantity exceeds sold quantity', 400);

    const total = quantity * unitPrice;

    const item = await SaleReturnItem.create(
      {
        saleReturnId,
        businessId,
        warehouseId: saleReturn.warehouseId,
        productId,
        quantity,
        unitPrice,
        total
      },
      { transaction: t }
    );

    // 📦 Stock IN
    await Stock.create(
      {
        businessId,
        warehouseId: saleReturn.warehouseId,
        productId,
        quantity,
        type: 'SALE_RETURN',
        referenceId: saleReturnId,
        note: 'Sale return item'
      },
      { transaction: t }
    );

    // 🔄 Recalculate totals
    const totalAmount =
      (await SaleReturnItem.sum('total', { where: { saleReturnId }, transaction: t })) || 0;

    saleReturn.totalAmount = totalAmount;
    saleReturn.dueAmount = totalAmount - saleReturn.paidAmount;
    saleReturn.status = calculateStatus(totalAmount, saleReturn.paidAmount);
    await saleReturn.save({ transaction: t });

    res.status(201).json({
      status: 1,
      message: 'Sale return item added',
      data: item
    });
  });
});

exports.getSaleReturns = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, customerId, fromDate, toDate } = req.query;
  const businessId = getBusinessId();

  const where = {
    businessId,
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(fromDate || toDate
      ? {
          returnDate: {
            ...(fromDate && { [Op.gte]: new Date(fromDate) }),
            ...(toDate && { [Op.lte]: new Date(toDate) })
          }
        }
      : {})
  };

  const { count, rows } = await SaleReturn.findAndCountAll({
    where,
    include: ['customer', 'warehouse', 'items'],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset: (page - 1) * limit
  });

  res.status(200).json({
    status: 1,
    total: count,
    page: Number(page),
    pages: Math.ceil(count / limit),
    data: rows
  });
});

exports.getSaleReturnById = catchAsync(async (req, res, next) => {
  const saleReturn = await SaleReturn.findByPk(req.params.id, {
    include: ['sale', 'customer', 'warehouse', 'items']
  });

  if (!saleReturn) return next(new AppError('Sale return not found', 404));

  res.status(200).json({
    status: 1,
    data: saleReturn
  });
});

exports.deleteSaleReturn = catchAsync(async (req, res, next) => {
  await sequelize.transaction(async (t) => {
    const saleReturn = await SaleReturn.findByPk(req.params.id, {
      include: ['items'],
      transaction: t
    });

    if (!saleReturn) throw new AppError('Sale return not found', 404);
    if (saleReturn.status === 'paid')
      throw new AppError('Paid sale return cannot be deleted', 400);

    for (const item of saleReturn.items) {
      await Stock.create(
        {
          businessId: saleReturn.businessId,
          warehouseId: saleReturn.warehouseId,
          productId: item.productId,
          quantity: -item.quantity,
          type: 'REVERT',
          referenceId: saleReturn.id
        },
        { transaction: t }
      );
      await item.destroy({ transaction: t });
    }

    await saleReturn.destroy({ transaction: t });

    res.status(200).json({
      status: 1,
      message: 'Sale return deleted successfully'
    });
  });
});
