
const db = require('../models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const {Business,Product,User,Category,Brand,Unit} = db;

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const { formatDate } = require("../utils/dateUtils")
const {extractFiles} = require('../utils/fileUtils');
const e = require('express');

require('dotenv').config();

exports.createProduct = catchAsync(async (req, res, next) => {
  console.log("incoming product body:", req.body);
  console.log("uploading files:", req.files);

  const {businessId,name,sku,partNumber,serialTracking,
    categoryId,brandId,unitId,defaultCostPrice,defaultSellingPrice,
    lastPurchaseCost,minimumStock,preferredCostMethod,barcode,isActive} = req.body;

  if (!businessId || !name || !categoryId || !brandId || !unitId) {
    return next(new AppError("Missing required fields for product creation", 400));
  }

  const [business, category, brand, unit] = await Promise.all([
    Business.findByPk(businessId),
    Category.findByPk(categoryId),
    Brand.findByPk(brandId),
    Unit.findByPk(unitId)
  ]);

  if (!business) return next(new AppError("Invalid businessId", 400));
  if (!category) return next(new AppError("Invalid categoryId", 400));
  if (!brand) return next(new AppError("Invalid brandId", 400));
  if (!unit) return next(new AppError("Invalid unitId", 400));

  const existingProduct = await Product.findOne({
    where: { name, businessId }
  });

  if (existingProduct) {
    return next(new AppError("Product already exists", 400));
  }
  const validCostMethods = ['FIFO', 'LIFO', 'AVERAGE'];
  const safeCostMethod = validCostMethods.includes(preferredCostMethod)
    ? preferredCostMethod
    : 'AVERAGE';

  const files = extractFiles(req, 'products');
  const extractedImages = files?.multiple('images') || [];

  try {
    const newProduct = await Product.create({
      businessId,
      name,
      sku,
      partNumber,
      serialTracking: serialTracking ?? false,
      categoryId,
      brandId,
      unitId,
      defaultCostPrice: defaultCostPrice ?? 0,
      defaultSellingPrice: defaultSellingPrice ?? 0,
      lastPurchaseCost: lastPurchaseCost ?? 0,
      minimumStock: minimumStock ?? 0,
      preferredCostMethod: safeCostMethod,
      barcode,
      images: extractedImages,
      isActive: isActive ?? true
    });

    res.status(200).json({
      status: 1,
      message: "Product created successfully",
      data: newProduct
    });
  } catch (error) {
    console.error("MYSQL ERROR:", error);
    return next(new AppError(error.message, 400));
  }
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const { isActive, search, sortBy, sortOrder, page = 1, limit = 20 } = req.query;

  let whereQuery = {};
  // isActive Filter
  if (isActive !== undefined) {
    whereQuery.isActive = ["true", "1", true, 1].includes(isActive);
  }

  // Search Filter (name, email, phone)
  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
      { partNumber: { [Op.like]: `%${search}%` } },
      { serialTracking: { [Op.like]: `%${search}%` } },
      { barcode: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ["createdAt", "updatedAt", "name", "sku"];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

  // Pagination
  const skip = (page - 1) * limit;

  // 4️FETCH USERS (PAGINATED + FILTERED)
  const { rows: products, count: totalFiltered } = await Product.findAndCountAll({
    where: whereQuery,
    offset: skip,
    limit: Number(limit),
    order: [[sortColumn, orderDirection]],
  });

  if (products.length === 0) {
    return next(new AppError("No products found", 404));
  }


  const formattedProducts = products.map(p => ({
    ...p.toJSON(),
    formattedCreatedAt: p.createdAt ? formatDate(p.createdAt) : null,
    formattedUpdatedAt: p.updatedAt ? formatDate(p.updatedAt) : null,
  }));

  res.status(200).json({
    status: 1,
    length: formattedProducts.length,
    message: 'Products fetched successfully',
    products: formattedProducts,
  });
});

exports.getProductById = catchAsync(async (req, res, next) => {

  const product = await Product.findOne({
    where: {
      id: req.params.productId,
      // businessId: req.user.businessId
    }
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 1,
    message: 'Product fetched successfully',
    data:product
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  console.log("Updating product with data:", req.body);
  const product = await Product.findOne({
    where: {
      id: req.params.productId,
      // businessId: req.user.businessId
    }
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const files = extractFiles(req, 'products');
  const extractedImages = files?.multiple('images') || [];

  if (extractedImages?.length) {
    req.body.images = extractedImages;
  }

  await product.update(req.body);

  res.status(200).json({
    status: 1,
    message: 'Product updated successfully',
    data:product
  });
});
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    where: {
      id: req.params.productId,
      // businessId: req.user.businessId
    }
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  await product.update({ isActive: false });

  res.status(200).json({
    status: 1,
    message: 'Product deleted successfully',
    data:product
  });
});
exports.hardDeleteProduct = catchAsync(async (req, res, next) => {
  const deleted = await Product.destroy({
    where: {
      id: req.params.productId,
      // businessId: req.user.businessId
    }
  });

  if (!deleted) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({ 
    status: 1, 
    message: "Product deleted permanently" });
});

exports.deleteAllProducts = catchAsync(async (req, res, next) => {
  const deleted = await Product.destroy({
    where: {
      // businessId: req.user.businessId
    }
  });
  res.status(200).json({ 
    status: 1, 
    message: `${deleted} products deleted permanently` });
});

