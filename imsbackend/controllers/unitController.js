const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {Unit,Product} = require('../models');
const { Op,Sequelize } = require('sequelize');
const validator = require('validator');

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils")

exports.createUnit = catchAsync(async (req, res, next) => {
  console.log("Unit creation request", req.body);
  const { name, symbol, baseUnit, operator, operationValue, description, isActive } = req.body;

  // Frontend form only asks for name + description; make others optional with sensible defaults.
  if (!name || !description) {
    return next(new AppError("Name and description are required", 400));
  }

  const existingUnit = await Unit.findOne({ where: { name } });
  if (existingUnit) {
    return next(new AppError("Unit already in use", 400));
  }

  const businessId = req.user.businessId;
  const resolvedSymbol = symbol || name;
  const resolvedBaseUnit = baseUnit || name;

  const newUnit = await Unit.create({
    businessId,
    name,
    symbol: resolvedSymbol,
    baseUnit: resolvedBaseUnit,
    operator: operator || '*',
    operationValue: operationValue || '1',
    description,
    isActive: isActive !== undefined ? isActive : true
  });

  res.status(200).json({
    status: 1,
    message: 'Unit registered successfully.',
    newUnit
  });
});

exports.getAllUnits = catchAsync(async (req, res, next) => {
  const {symbol,baseUnit,operator,operationValue,isActive,search,sortBy,sortOrder,page = 1,limit = 20} = req.query;

  console.log("Query Params:", req.query.search);
  let whereQuery = {}

  if (isActive !== undefined) {
    whereQuery.isActive =isActive === "true" || isActive === "1" ? true : false;
  }

  if(symbol) whereQuery.symbol=symbol
  if(baseUnit) whereQuery.baseUnit=baseUnit
  if(operator) whereQuery.operator=operator
  if(operationValue) whereQuery.operationValue=operationValue

  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { symbol: { [Op.like]: `%${search}%` } },
      { baseUnit: { [Op.like]: `%${search}%` } },
      { operator: { [Op.like]: `%${search}%` } },
      { operationValue: { [Op.like]: `%${search}%` } },
      { isActive: { [Op.like]: `%${search}%` } },
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

  if (count === 0) {
    return res.status(200).json({
      status: 1,
      length: 0,
      message: "No units found",
      units: [],
    });
  }

  res.status(200).json({
    status: 1,
    length: count,
    message: "Units fetched successfully",
    units: rows
  });
});

exports.getUnit = catchAsync(async (req, res, next) => {
  console.log("Requested User Role:", req.user.role,req.params);
  const unitId = parseInt(req.params.unitId, 10); 

  const unit = await Unit.findByPk(unitId, {
    attributes: [
      'id',
      'name',
      'symbol',
      'description',
      'isActive',
      [
        Sequelize.literal(`(
          SELECT COUNT(*)
          FROM Products
          WHERE Products.unitId = Unit.id
        )`),
        'productCount'
      ]
    ],
    include: [
      {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'sku'],
        required: false
      }
    ]
  });

  if (!unit) {
    return res.status(404).json({
      status: 0,
      message: `Unit with ID ${unitId} not found`,
      unit: null
    });
  }
  
    res.status(200).json({
      status: 1,
      message: 'Unit fetched successfully!',
      data: unit
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

exports.toggleUnitStatus = catchAsync(async (req, res, next) => {
  const unit = await Unit.findByPk(req.params.unitId);

  if (!unit) return next(new AppError("Unit not found", 404));

  unit.isActive = !unit.isActive;
  await unit.save();

  res.status(200).json({
    status: 1,
    message: `Unit ${unit.isActive ? "activated" : "deactivated"} successfully`,
    isActive: unit.isActive
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

exports.getUnitSummaryReport = catchAsync(async (req, res) => {
  console.log("Unit Summary report reach")
  const total = await Unit.count();
  const active = await Unit.count({ where: { isActive: true } });
  const inactive = await Unit.count({ where: { isActive: false } });

  console.log("Unit Summary report",total,active,inactive)
  res.status(200).json({
    status: 1,
    totalUnits: total,
    activeUnits: active,
    inactiveUnits: inactive
  });
});

exports.unitProductreport = catchAsync(async (req, res, next) => {

  const unit = await Unit.findAll({
    where: { businessId:req.user.businessId },
    attributes: [
      'id',
      'name',
      'symbol',
      'description',
      'isActive',
      [
        Sequelize.literal(`(
          SELECT COUNT(*)
          FROM Products
          WHERE Products.unitId = Unit.id
        )`),
        'productCount'
      ]
    ],
    include: [
      {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'sku', 'price'],
        required: false
      }
    ],
    order: [[{ model: Product, as: 'products' }, 'name', 'ASC']]
  });

  if (!unit) {
    return res.status(200).json({
      status: 0,
      message: `Unit not found`,
      data: null
    });
  }

  res.status(200).json({
    status: 1,
    message: 'Unit summary fetched successfully',
    data: unit
  });

});




