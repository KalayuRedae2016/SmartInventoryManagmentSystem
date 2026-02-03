const { Purchase, Supplier, Warehouse } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

const calculateStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};


exports.createPurchase = catchAsync(async (req, res, next) => {
  const { warehouseId,supplierId,totalAmount,paidAmount = 0,paymentMethod,note} = req.body;

  console.log("purchase request",req.body)

  const businessId = getBusinessId()
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
console.log("creaed purchase",purchase)
  res.status(201).json({
    status: 1,
    message: 'Purchase created successfully',
    data: purchase,
  });
});

exports.getAllPurchases = catchAsync(async (req, res) => {
  const {page = 1,limit = 10,search,status} = req.query;

  const where = {
    businessId: getBusinessId(),
    isActive: true,
  };

  if (status) where.status = status;
  if (search) where.note = { [Op.like]: `%${search}%` };

  const purchases = await Purchase.findAndCountAll({
    where,
    // include: [Supplier, Warehouse],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    message: 'Purchases fetched successfully',
    result: purchases.count,
    data: purchases.rows,
  });
});

exports.getPurchaseById = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findByPk(req.params.id, {
    include: [
      Supplier,
      Warehouse,
      {
        model: PurchaseItem,
        include: [Product], // Include product details for each item
      },
    ],
  });

  if (!purchase || !purchase.isActive) {
    return next(new AppError('Purchase not found', 404));
  }

  // Calculate total of items
  const itemsTotal =
    (await PurchaseItem.sum('total', {
      where: { purchaseId: purchase.id },
    })) || 0;

  const remainingAmount = purchase.totalAmount - itemsTotal;

  res.status(200).json({
    status: 1,
    message: 'Purchase and items fetched successfully',
    data: {
      ...purchase.toJSON(),
      itemsTotal,
      remainingAmount,
      isLocked: remainingAmount === 0,
    },
  });
});

exports.updatePurchase = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findByPk(req.params.purchaseId);

  if (!purchase) return next(new AppError('Purchase not found', 404));
  
  if (purchase.status === 'paid') {
    return next(new AppError('Paid purchase cannot be modified', 400));
  }

  const { totalAmount, paidAmount, note } = req.body;

  if (paidAmount && paidAmount > totalAmount) {
    return next(new AppError('Invalid paid amount', 400));
  }

  if (totalAmount !== undefined) purchase.totalAmount = totalAmount;
  if (paidAmount !== undefined) purchase.paidAmount = paidAmount;
  if (note !== undefined) purchase.note = note;

  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(
    purchase.totalAmount,
    purchase.paidAmount
  );

  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase updated successfully',
    data: purchase,
  });
});

exports.payPurchase = catchAsync(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return next(new AppError('Invalid payment amount', 400));
  }

  const purchase = await Purchase.findByPk(req.params.purchaseId);
  if (!purchase) return next(new AppError('Purchase not found', 404));
  
  if (purchase.paidAmount + amount > purchase.totalAmount) {
    return next(new AppError('Overpayment not allowed', 400));
  }

  purchase.paidAmount += amount;
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(
    purchase.totalAmount,
    purchase.paidAmount
  );

  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Payment recorded successfully',
    data: purchase,
  });
});

exports.deletePurchase = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findByPk(req.params.id);

  if (!purchase) {
    return next(new AppError('Purchase not found', 404));
  }

  if (purchase.status === 'paid') {
    return next(new AppError('Paid purchase cannot be deleted', 400));
  }

  purchase.isActive = false;
  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase deleted successfully',
  });
});

exports.deleteAllPurchases=catchAsync(async(req,res,next)=>{
  const deltedPurchases=await Purchase.destroy()
  res.status(200).json({
    status:1,
    message:`${deltedPurchases.count} are deleted succfully`
  })
})