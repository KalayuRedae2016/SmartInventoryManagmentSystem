const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op, where,Sequelize } = require('sequelize');
const validator = require('validator');
const {Category,Product}=require("../models")

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils")

exports.createCategory = catchAsync(async (req, res, next) => {
  console.log("category creation request", req.body)

  const {name, description,isActive} = req.body;
  if (!name || !description) {
    return next(new AppError("required Fields->businessId, name or description)", 404))
  }
  
const existingCategory= await Category.findOne({ where: { name } });
if (existingCategory) {
  return (next(new AppError("Categories already in use", 404)))
}

  const category = await Category.create({
    businessId:req.user.businessId,
    name,
    description,
    isActive: isActive !== undefined ? isActive : true,
  });
  
  res.status(200).json({
    status:1,
    message: 'Category registered successfully.',
    data: category,
  });

});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const {isActive,search,sortBy,sortOrder,page = 1,limit = 20} = req.query;

  console.log("Query Params:", req.query.search);
  let whereQuery = {}

  if (isActive !== undefined) {
    whereQuery.isActive =isActive === "true" || isActive === "1" ? true : false;
  }

  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortColumns = ["createdAt", "updatedAt", "name"];
  const sortColumn = validSortColumns.includes(sortBy)
    ? sortBy
    : "createdAt";

  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";
  const skip = (page - 1) * limit;

  const { rows, count } = await Category.findAndCountAll({
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
      message: "No categories found",
      categories: [],
    });
  }

  res.status(200).json({
    status: 1,
    length: rows.length,
    total: count,
    message: "Categories fetched successfully",
    categories: rows
  });
});

exports.getCategoryById = catchAsync(async (req, res, next) => {

  const categoryId = parseInt(req.params.categoryId, 10);

  const category = await Category.findByPk(categoryId, {
    attributes: [
      'id',
      'name',
      'description',
      'isActive',
      [
        Sequelize.literal(`(
          SELECT COUNT(*)
          FROM Products
          WHERE Products.categoryId = Category.id
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

  if (!category) {
    return res.status(404).json({
      status: 0,
      message: `Category with ID ${categoryId} not found`,
      category: null
    });
  }

  res.status(200).json({
    status: 1,
    message: 'Category fetched successfully!',
    data: category
  });

});

exports.updateCategoryById = catchAsync(async (req, res, next) => {
  console.log("Update category request body:", req.body,req.params);
  const existingCategory = await Category.findByPk(parseInt(req.params.categoryId, 10));
  if (!existingCategory) {
    return next(new AppError("Customer not found", 404));
  }

  const orgiginalCategoryData = JSON.parse(JSON.stringify(existingCategory));
  
  const updateData = {  ...req.body};

  await existingCategory.update(updateData);

  const updatedCategory = await Category.findByPk(parseInt(req.params.categoryId, 10));

  const formattedCreatedAt = updatedCategory.createdAt ? formatDate(updatedCategory.createdAt) : null;
  const formattedUpdatedAt = updatedCategory.updatedAt ? formatDate(updatedCategory.updatedAt) : null;

  res.status(200).json({
    status: 1,
    message: `${updatedCategory.name} updated successfully`,
    updatedCategory: {
      ...updatedCategory.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt,
    },
   
  });
});

exports.toggleCategoryStatus = catchAsync(async (req, res, next) => {
  const category = await Category.findByPk(req.params.categoryId);

  if (!category) return next(new AppError("Category not found", 404));

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({
    status: 1,
    message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
    isActive: category.isActive
  });
});

exports.deleteCategoryById= catchAsync(async (req, res, next) => {
  const categoryId = parseInt(req.params.categoryId, 10);

  const deletedCount = await Category.destroy({ where: { id: categoryId } });

  if (deletedCount === 0) {
    res.status(200).json({
      status: 0,
      message: `Category with ID ${categoryId} not found`,
    });
  }

  res.status(200).json({
    status: 1,
    length: deletedCount,
    message: 'Category deleted successfully',
  });
});

exports.deleteAllCategories= catchAsync(async (req, res, next) => {
  const deletedCount = await Category.destroy({
    where: {}, // No condition = delete all rows
  });

  if (deletedCount === 0) {
    res.status(200).json({
      status: 0,
      message: "No Category entries found to delete",
    });
    //    return next(new AppError("No Customer entries found to delete", 404));
  }

  //🧹 Delete profile image from disk
  //🧹 log action
  res.status(200).json({
    status: 'success',
    length: deletedCount,
    message: `${deletedCount} categories deleted`,
  });
});

exports.getCategorySummaryReport = catchAsync(async (req, res) => {
  console.log("category Summary report reach")
  const total = await Category.count();
  const active = await Category.count({ where: { isActive: true } });
  const inactive = await Category.count({ where: { isActive: false } });

  console.log("category Summary report",total,active,inactive)
  res.status(200).json({
    status: 1,
    totalCategories: total,
    activeCategories: active,
    inactiveCategories: inactive
  });
});

exports.categoryProductReport = catchAsync(async (req, res) => {
    const { businessId } = req.user;

    const categories = await Category.findAll({
      where: { businessId },
      attributes: [
        'id',
        'name',
        'description',
        'isActive',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM Products
            WHERE Products.categoryId = Category.id
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
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
});

