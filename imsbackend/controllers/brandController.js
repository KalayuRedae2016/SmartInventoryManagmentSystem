const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const{Brand,Product} = require('../models');
const { Op,Sequelize } = require('sequelize');
const validator = require('validator');

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/dateUtils")
const {extractFiles}=require("../utils/fileUtils");
const brand = require('../models/brand');

exports.createBrand = catchAsync(async (req, res, next) => {
  console.log("brand creation request", req.body,req.files)
    
  const {  businessId,name, country,description,image,isActive} = req.body;
  if (!name ||!country || !description) {
    return next(new AppError("required Fields->businessId, name country,or description)", 404))
  }
  
const existingBrand = await Brand.findOne({where: { name, businessId }});
if (existingBrand) return (next(new AppError("brand already in use", 404)))

const files=extractFiles(req, 'brands');
const extractedImage =files.single('image');

  const newbrand = await Brand.create({
    businessId:req.user.businessId,
    name,
    country,
    description,
    image:extractedImage,
    isActive: isActive !== undefined ? isActive : true,
  });
  
  res.status(200).json({
    message: 'Brand registered successfully.',
    data: newbrand,
  });

});

exports.getAllBrands = catchAsync(async (req, res, next) => {
  const {country,isActive,search,sortBy,sortOrder,page = 1,limit = 20} = req.query;

  console.log("Query Params:", req.query.search);
  let whereQuery = {}

  if (isActive !== undefined) {
    whereQuery.isActive =isActive === "true" || isActive === "1" ? true : false;
  }

  if(country) whereQuery.country=country
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

  const { rows, count } = await Brand.findAndCountAll({
    where: whereQuery,
    offset: skip,
    limit: Number(limit),
    order: [[sortColumn, orderDirection]],
  });

  const active = await Brand.count({ where: { isActive: true } });
  const inactive = await Brand.count({ where: { isActive: false } });

  // If no categories found
  if (count === 0) {
    return res.status(200).json({
      status: 1,
      length: 0,
      message: "No brands found",
      brands: [],
    });
  }
  res.status(200).json({
    status: 1,
    length: rows.length,
    total: count,
    active,
    inactive,
    message: "Categories fetched successfully",
    brands: rows
  });
});

exports.getBrand = catchAsync(async (req, res, next) => {
  const brandId = parseInt(req.params.brandId, 10); 
  const brand = await Brand.findByPk(brandId, {
      attributes: [
        'id',
        'name',
        'country',
        'description',
        'isActive',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM Products
            WHERE Products.brandId = Brand.id
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

  if (!brand) {
    res.status(200).json({
      status: 0,
      message: `Brand with ID ${brandId} not found`,
      brand: null,
    });
    //return next(new AppError('Customer not found', 404));
  }
  
  res.status(200).json({
    status: 1,
    message: `brand fetched successfully!`,
    brand:brand
  });
});

exports.updateBrand = catchAsync(async (req, res, next) => {

  const brandId = parseInt(req.params.brandId, 10);

  const brand = await Brand.findByPk(brandId);

  if (!brand) {
    return res.status(200).json({
      status: 0,
      message: `Brand with ID ${brandId} not found`,
      data: []
    });
  }

  const updateData = { ...req.body.req.files.image };

  await brand.update(updateData);

  res.status(200).json({
    status: 1,
    message: `${brand.name} updated successfully`,
    data: brand
  });

});

exports.toggleBrandStatus = catchAsync(async (req, res, next) => {
  const brand = await Brand.findByPk(req.params.categoryId);

  if (!brand) return next(new AppError("Brand not found", 404));

  brand.isActive = !brand.isActive;
  await brand.save();

  res.status(200).json({
    status: 1,
    message: `Brand ${brand.isActive ? "activated" : "deactivated"} successfully`,
    isActive: brand.isActive
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

exports.getBrandSummaryReport = catchAsync(async (req, res) => {
  console.log("Brand Summary report reach")
  const total = await Brand.count();
  const active = await Brand.count({ where: { isActive: true } });
  const inactive = await Brand.count({ where: { isActive: false } });

  console.log("Brand Summary report",total,active,inactive)
  res.status(200).json({
    status: 1,
    totalBrands: total,
    activeBrands: active,
    inactiveBrands: inactive
  });
});

exports.Brandproductreport = catchAsync(async (req, res, next) => {
  
  const brand = await Brand.findAll({
    where: { businessId: req.user.businessId },
    attributes: [
      'id',
      'name',
      'country',
      'description',
      'isActive',
      [
        Sequelize.literal(`(
          SELECT COUNT(*)
          FROM Products
          WHERE Products.brandId = Brand.id
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

  if (!brand) {
    return res.status(200).json({
      status: 0,
      message: `Brand not found`,
      data: null
    });
  }

  res.status(200).json({
    status: 1,
    message: 'Brand summary fetched successfully',
    data: brand
  });

});

