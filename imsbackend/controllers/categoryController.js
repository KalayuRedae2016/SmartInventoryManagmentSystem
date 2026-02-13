const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op, where } = require('sequelize');
const validator = require('validator');
const {Category}=require("../Models")

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils")

exports.createCategory = catchAsync(async (req, res, next) => {
  console.log("category creation request", req.body)

  const {businessId,name, description,isActive} = req.body;
  if (!businessId || !name || !description) {
    return next(new AppError("required Fields->businessId, name or description)", 404))
  }
  
  
const existingCategory= await Category.findOne({ where: { name } });
if (existingCategory) {
  return (next(new AppError("Categories already in use", 404)))
}

  const newCategory = await Category.create({
    businessId,
    name,
    description,
    isActive: isActive !== undefined ? isActive : true,
  });
  
  res.status(200).json({
    status:1,
    message: 'Category registered successfully.',
    data: newCategory,
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

  const formattedCategories = rows.map(c => ({
    ...c.toJSON(),
    formattedCreatedAt: c.createdAt ? formatDate(c.createdAt) : null,
    formattedUpdatedAt: c.updatedAt ? formatDate(c.updatedAt) : null,
  }));


  res.status(200).json({
    status: 1,
    length: formattedCategories.length,
    total: count,
    message: "Categories fetched successfully",
    categories: formattedCategories,
  });
});

exports.getCategoryById = catchAsync(async (req, res, next) => {
  const category = await Category.findByPk(parseInt(req.params.categoryId, 10));

  if (!category) {
    res.status(200).json({
      status: 0,
      message: `Category with ID ${categoryId} not found`,
      category: null,
    });
    //return next(new AppError('Customer not found', 404));
  }

  const formattedCreatedAt = category.createdAt ? formatDate(category.createdAt) : null;
  const formattedUpdatedAt = category.updatedAt ? formatDate(category.updatedAt) : null;
  
  res.status(200).json({
    status: 1,
    message: `category fetched successfully!`,
    category: {
      ...category.toJSON(),
      formattedCreatedAt,
      formattedUpdatedAt
    },
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




