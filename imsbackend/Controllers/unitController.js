const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../Models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const Unit   = db.Unit;

const catchAsync = require("../Utils/catchAsync")
const AppError = require("../Utils/appError")
require('dotenv').config();
const { formatDate } = require("../Utils/formatDate")

const {createMulterMiddleware,processUploadFilesToSave} = require('../Utils/fileController');
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

exports.createUnit = catchAsync(async (req, res, next) => {
  console.log("Unit creation request", req.body)

  const { name, symbol,description,isActive} = req.body;
  if (!name ||!symbol || !description) {
    return next(new AppError("required Fields->name,symbol or description)", 404))
  }
  
console.log("unit model:", Unit=== undefined ? "Not loaded" : "Loaded");
  
const existingUnit= await Unit.findOne({ where: { name } });
if (existingUnit) {
  // if (req.files) deleteFile(req.files.path);
  return (next(new AppError("unit already in use", 404)))
}

  const newUnit = await Unit.create({
    name,
    symbol,
    description,
    isActive: isActive !== undefined ? isActive : true,
    // documents: documents || null,
  });
  
  // Return success response
  res.status(200).json({
    message: 'Unit registered successfully.',
    newUnit: newUnit,
  });

});

exports.getAllUnits = catchAsync(async (req, res, next) => {
  const {isActive,search,sortBy,sortOrder,page = 1,limit = 20} = req.query;

  console.log("Query Params:", req.query.search);
  let whereQuery = {}

  if (isActive !== undefined) {
    whereQuery.isActive =isActive === "true" || isActive === "1" ? true : false;
  }

  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { symbol: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ["createdAt", "updatedAt", "name"];
  const sortColumn = validSortColumns.includes(sortBy)
    ? sortBy
    : "createdAt";

  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";
  const skip = (page - 1) * limit;

  const { rows, count } = await Unit.findAndCountAll({
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
      message: "No units found",
      units: [],
    });
  }

  const formattedunits = rows.map(u => ({
    ...u.toJSON(),
    formattedCreatedAt: u.createdAt ? formatDate(u.createdAt) : null,
    formattedUpdatedAt: u.updatedAt ? formatDate(u.updatedAt) : null,
  }));


  res.status(200).json({
    status: 1,
    length: formattedunits.length,
    total: count,
    message: "Categories fetched successfully",
    units: formattedunits,
  });
});

exports.getUnit = catchAsync(async (req, res, next) => {
  console.log("Requested User Role:", req.user.role,req.params);
  const unitId = parseInt(req.params.unitId, 10); 
  console.log("Fetching customer with ID:", unitId);
  const unit = await Unit.findByPk(unitId);
  console.log("Fetched customer:", unit);

  if (!unit) {
    res.status(200).json({
      status: 0,
      message: `Unit with ID ${unitId} not found`,
      unit: null,
    });
    //return next(new AppError('Customer not found', 404));
  }

  const formattedCreatedAt = unit.createdAt ? formatDate(unit.createdAt) : null;
  const formattedUpdatedAt = unit.updatedAt ? formatDate(unit.updatedAt) : null;
  
  res.status(200).json({
    status: 1,
    message: `unit fetched successfully!`,
    unit: {
      ...unit.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt
    },
  });
});

exports.updateUnit = catchAsync(async (req, res, next) => {
  const unitId = parseInt(req.params.unitId, 10); 
  const existingUnit = await Unit.findByPk(unitId);
  if (!existingUnit) {
    res.status(200).json({
      status: 0,
      message: `Unit with ID ${unitId} not found`,
    });
    // return next(new AppError("Customer not found", 404));
  }

  const orgiginalBrandData = JSON.parse(JSON.stringify(existingUnit));
  
  // Merge update fields
  const updateData = {
    ...req.body,
    //profileImage
  };

  // Update user
  await existingUnit.update(updateData);

  // Fetch latest version
  const updatedBrand = await Unit.findByPk(unitId);

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

exports.deleteUnit= catchAsync(async (req, res, next) => {
  const unitId = parseInt(req.params.unitId, 10);

  const deletedCount = await Unit.destroy({ where: { id: unitId } });

  if (deletedCount === 0) {
    res.status(200).json({
      status: 0,
      message: `Unit with ID ${unitId} not found`,
    });
    // return next(new AppError("Customer entry not found", 404));
  }

  res.status(200).json({
    status: 'success',
    length: deletedCount,
    message: 'Unit deleted successfully',
  });
});

exports.deleteAllUnits= catchAsync(async (req, res, next) => {
  const deletedCount = await Unit.destroy({
    where: {}, // No condition = delete all rows
  });

  if (deletedCount === 0) {
    res.status(200).json({
      status: 0,
      message: "No Unit entries found to delete",
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




