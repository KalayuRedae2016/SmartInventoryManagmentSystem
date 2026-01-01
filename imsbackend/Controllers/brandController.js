const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../Models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const Brand   = db.Brand;

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/formatDate")

const {createMulterMiddleware,processUploadFilesToSave} = require('../utils/fileController');
const category = require('../Models/category');

// Configure multer for user file uploads
const userFileUpload = createMulterMiddleware(
  'uploads/importedUsers/', // Destination folder
  'User', // Prefix for filenames
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] // Allowed file types
);

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Middleware for handling single file upload
exports.uploadUserFile = userFileUpload.single('file');

exports.createBrand = catchAsync(async (req, res, next) => {
  console.log("brand creation request", req.body)

  const { name, country,description,isActive} = req.body;
  if (!name ||!country || !description) {
    return next(new AppError("required Fields->name country,or description)", 404))
  }
  
console.log("brand model:", Brand=== undefined ? "Not loaded" : "Loaded");
  
const existingBrand= await Brand.findOne({ where: { name } });
if (existingBrand) {
  // if (req.files) deleteFile(req.files.path);
  return (next(new AppError("brand already in use", 404)))
}

  const newbrand = await Brand.create({
    name,
    country,
    description,
    isActive: isActive !== undefined ? isActive : true,
    // documents: documents || null,
  });
  
  // Return success response
  res.status(200).json({
    message: 'Brand registered successfully.',
    data: newbrand,
  });

});

exports.getAllBrands = catchAsync(async (req, res, next) => {
  const {isActive,search,sortBy,sortOrder,page = 1,limit = 20} = req.query;

  console.log("Query Params:", req.query.search);
  let whereQuery = {}

  if (isActive !== undefined) {
    whereQuery.isActive =isActive === "true" || isActive === "1" ? true : false;
  }

  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { country: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ["createdAt", "updatedAt", "name"];
  const sortColumn = validSortColumns.includes(sortBy)
    ? sortBy
    : "createdAt";

  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";
  const skip = (page - 1) * limit;

  const { rows, count } = await Brand.findAndCountAll({
    where: whereQuery,
    offset: skip,
    limit: Number(limit),
    order: [[sortColumn, orderDirection]],
  });

  // If no categories found
  if (count === 0) {
    return res.status(200).json({
      status: 1,
      length: 0,
      message: "No brands found",
      brands: [],
    });
  }

  const formattedBrands = rows.map(b => ({
    ...b.toJSON(),
    formattedCreatedAt: b.createdAt ? formatDate(b.createdAt) : null,
    formattedUpdatedAt: b.updatedAt ? formatDate(b.updatedAt) : null,
  }));


  res.status(200).json({
    status: 1,
    length: formattedBrands.length,
    total: count,
    message: "Categories fetched successfully",
    brands: formattedBrands,
  });
});

exports.getBrand = catchAsync(async (req, res, next) => {
  console.log("Requested User Role:", req.user.role,req.params);
  const brandId = parseInt(req.params.brandId, 10); 
  console.log("Fetching customer with ID:", brandId);
  const brand = await Brand.findByPk(brandId);
  console.log("Fetched customer:", brand);

  if (!brand) {
    res.status(200).json({
      status: 0,
      message: `Brand with ID ${brandId} not found`,
      brand: null,
    });
    //return next(new AppError('Customer not found', 404));
  }

  const formattedCreatedAt = brand.createdAt ? formatDate(brand.createdAt) : null;
  const formattedUpdatedAt = brand.updatedAt ? formatDate(brand.updatedAt) : null;
  
  res.status(200).json({
    status: 1,
    message: `brand fetched successfully!`,
    brand: {
      ...brand.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt
    },
  });
});

exports.updateBrand = catchAsync(async (req, res, next) => {
  const brandId = parseInt(req.params.brandId, 10); 
  const existingBrand = await Brand.findByPk(brandId);
  if (!existingBrand) {
    res.status(200).json({
      status: 0,
      message: `Brand with ID ${brandId} not found`,
    });
    // return next(new AppError("Customer not found", 404));
  }

  const orgiginalBrandData = JSON.parse(JSON.stringify(existingBrand));
  
  // Merge update fields
  const updateData = {
    ...req.body,
    //profileImage
  };

  // Update user
  await existingBrand.update(updateData);

  // Fetch latest version
  const updatedBrand = await Brand.findByPk(brandId);

  // Format timestamps
  const formattedCreatedAt = updatedBrand.createdAt ? formatDate(updatedBrand.createdAt) : null;
  const formattedUpdatedAt = updatedBrand.updatedAt ? formatDate(updatedBrand.updatedAt) : null;


  res.status(200).json({
    status: 1,
    message: `${updatedBrand.name} updated successfully`,
    updatedBrand: {
      ...updatedBrand.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt,
    },
   
  });
});

exports.deleteBrand= catchAsync(async (req, res, next) => {
  const brandId = parseInt(req.params.brandId, 10);

  const deletedCount = await Brand.destroy({ where: { id: brandId } });

  if (deletedCount === 0) {
    res.status(200).json({
      status: 0,
      message: `Brand with ID ${brandId} not found`,
    });
    // return next(new AppError("Customer entry not found", 404));
  }

  res.status(200).json({
    status: 'success',
    length: deletedCount,
    message: 'Brand deleted successfully',
  });
});

exports.deleteAllBrands= catchAsync(async (req, res, next) => {
  const deletedCount = await Brand.destroy({
    where: {}, // No condition = delete all rows
  });

  if (deletedCount === 0) {
    res.status(200).json({
      status: 0,
      message: "No Brand entries found to delete",
    });
    //    return next(new AppError("No Customer entries found to delete", 404));
  }

  //🧹 Delete profile image from disk
  //🧹 log action
  res.status(200).json({
    status: 'success',
    length: deletedCount,
    message: `${deletedCount} brand deleted`,
  });
});




