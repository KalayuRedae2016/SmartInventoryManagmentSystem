const { Supplier } = require('../models');
const { Op } = require('sequelize');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
import { Purchase, Supplier, Warehouse } from "../models";
import { Op } from "sequelize";

const getBusinessId = () => 1;
const calculateStatus = (total, paid) => {
  if (paid <= 0) return "pending";
  if (paid < total) return "partial";
  return "paid";
};

exports.createPurchase = catchAsync(async (req, res) => {
      const {businessId = getBusinessId(),
      warehouseId,
      supplierId,
      totalAmount,
      paidAmount = 0,
      paymentMethod,
      note,
    } = req.body;

    if (!businessId || !warehouseId || !supplierId || !totalAmount) {
      return next(new AppError('Missing required fields', 400));
      
    }

    const dueAmount = totalAmount - paidAmount;
    const status = calculateStatus(totalAmount, paidAmount);

    const purchase = await Purchase.create({
      businessId,
      warehouseId,
      supplierId,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMethod,
      status,
      note,
      isActive: true,
    });

    return res.status(200).json({
      status: 1,
      message: "Purchase created successfully",
      data: purchase,
    });
  
});

exports.getPurchases = catchAsync(async (req, res) => {
    const {page = 1,limit = 10,search,status,businessId} = req.query;

    const where = { isActive: true };

    if (businessId) where.businessId = businessId;
    if (status) where.status = status;

    if (search) {
      where.note = { [Op.like]: `%${search}%` };
    }

    const purchases = await Purchase.findAndCountAll({
      where,
      include: [Supplier, Warehouse],
      limit: +limit,
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: 1,
      message: "Purchases fetched successfully",
      data: purchases,
    });
});

exports.getPurchaseById = catchAsync(async (req, res) => {
    const purchase = await Purchase.findByPk(req.params.id, {
      include: [Supplier, Warehouse],
    });

    if (!purchase) {
      return failure(res, 404, "Purchase not found");
    }

    return success(res, "Purchase fetched successfully", purchase);
  return res.status(200).json({
    status: 1,
    message: "Purchase fetched successfully",
    data: purchase,
  });
});

exports.updatePurchase = catchAsync(async (req, res) => {
    const purchase = await Purchase.findByPk(req.params.id);

    if (!purchase) {
      return failure(res, 404, "Purchase not found");
    }

    if (purchase.status === "paid") {
      return failure(res, 400, "Paid purchase cannot be modified");
    }

    const { totalAmount, paidAmount, note } = req.body;

    if (totalAmount !== undefined) purchase.totalAmount = totalAmount;
    if (paidAmount !== undefined) purchase.paidAmount = paidAmount;
    if (note !== undefined) purchase.note = note;

    purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
    purchase.status = calculateStatus(
      purchase.totalAmount,
      purchase.paidAmount
    );

    await purchase.save();

    return success(res, "Purchase updated successfully", purchase);
  });

exports.updatePurchaseStatus = catchAsync(async (req, res) => {
    const { status } = req.body;

    const purchase = await Purchase.findByPk(req.params.id);
    if (!purchase) return failure(res, 404, "Purchase not found");

    purchase.status = status;
    await purchase.save();

  res.status(200).json({
    status: 1,
    message: "Purchase status updated successfully",
    data: purchase,
  });
  
});

exports.payPurchase = catchAsync(async (req, res) => {
    const { amount } = req.body;
    const purchase = await Purchase.findByPk(req.params.id);
    if (!purchase) return failure(res, 404, "Purchase not found");

    purchase.paidAmount += amount;
    purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
    purchase.status = calculateStatus(
      purchase.totalAmount,
      purchase.paidAmount
    );

    await purchase.save();
    return
    return.status(200).json({
      status: 1,
      message: "Purchase payment recorded successfully",
      data: purchase,
    });

});

exports.deletePurchase = catchAsync(async (req, res) => {
    const purchase = await Purchase.findByPk(req.params.id);
    if (!purchase) {
      return failure(res, 404, "Purchase not found");
    }

    if (purchase.status === "paid") {
      return failure(res, 400, "Paid purchase cannot be deleted");
    }

    purchase.isActive = false;
    await purchase.save();

  res.status(200).json({
    status: 1,
    message: "Purchase deleted successfully",
  });

});
