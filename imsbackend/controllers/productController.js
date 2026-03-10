
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const {Business,Product,User,Category,Brand,Unit,Stock,StockTransaction,PurchaseItem,SaleItem,Warehouse,} = db;
const {createMulterMiddleware,processUploadFilesToSave,importFromExcelFile,exportToExcelFile,exportToPDFFile} = require('../utils/fileUtils');

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")

const {extractFiles} = require('../utils/fileUtils');
require('dotenv').config();


// Configure multer for payment file uploads
const productUpload = createMulterMiddleware(
  'uploads/products/', 'product',
  ['image/jpeg','image/png','application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
);

// Middleware for handling multiple file 
exports.uploadproductAttachements=productUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 10 },
    { name: 'logo', maxCount: 1 },
  ])
exports.uploadProductFile = productUpload.single('file');// Middleware for handling single file upload


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

  if (existingProduct)  return next(new AppError("Product already exists", 400));
  
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

  const {
    isActive,
    categoryId,
    brandId,
    unitId,
    search,
    sortBy,
    sortOrder,
    page = 1,
    limit = 20,
    minPrice,
    maxPrice,
    minCost,
    maxCost
  } = req.query;

  const pageNumber = Number(page) || 1;
  const limitNumber = Math.min(Number(limit) || 20, 100);
  const offset = (pageNumber - 1) * limitNumber;

  let whereQuery = {
    businessId: req.user.businessId
  };

  // Active filter
  if (isActive !== undefined)
    whereQuery.isActive = ["true", "1", true, 1].includes(isActive);

  if (categoryId) whereQuery.categoryId = categoryId;
  if (brandId) whereQuery.brandId = brandId;
  if (unitId) whereQuery.unitId = unitId;

  // Search filter
  if (search) {
    whereQuery[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
      { partNumber: { [Op.like]: `%${search}%` } },
      { barcode: { [Op.like]: `%${search}%` } }
    ];
  }

  // Selling price range
  if (minPrice || maxPrice) {
    whereQuery.defaultSellingPrice = {};
    if (minPrice) whereQuery.defaultSellingPrice[Op.gte] = Number(minPrice);
    if (maxPrice) whereQuery.defaultSellingPrice[Op.lte] = Number(maxPrice);
  }

  // Cost price range
  if (minCost || maxCost) {
    whereQuery.defaultCostPrice = {};
    if (minCost) whereQuery.defaultCostPrice[Op.gte] = Number(minCost);
    if (maxCost) whereQuery.defaultCostPrice[Op.lte] = Number(maxCost);
  }

  // Sorting
  const validSortColumns = [
    "createdAt",
    "updatedAt",
    "name",
    "sku",
    "defaultSellingPrice",
    "defaultCostPrice"
  ];

  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

  const { rows: products, count } = await Product.findAndCountAll({
    where: whereQuery,
    offset,
    limit: limitNumber,
    order: [[sortColumn, orderDirection]],
    include: [
      { model: Category, as: "category", attributes: ["id", "name"] },
      { model: Brand, as: "brand", attributes: ["id", "name"] },
      { model: Unit, as: "unit", attributes: ["id", "name"] }
    ]
  });

  res.status(200).json({
    status: "success",
    results: products.length,
    total: count,
    page: pageNumber,
    pages: Math.ceil(count / limitNumber),
    products
  });

});

exports.getProductById = catchAsync(async (req, res, next) => {

  const product = await Product.findOne({
    where: {
      id: req.params.productId,
      businessId: req.user.businessId,
    },
    include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false
          },
          {
            model: Brand,
            as: 'brand',
            attributes: ['id', 'name'],
            required: false
          },
          {
            model: Unit,
            as: 'unit',
            attributes: ['id', 'name','symbol','baseUnit','operator','operationValue'],
            required: false
          },
        ]
  });

  if (!product) {
    return res.status(404).json({
      status: 0,
      message: `Product with ID ${req.params.productId} not found`,
      product: null
    });
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
       businessId: req.user.businessId
    }
  });

console.log("to be updatedProduct",product)

  if (!product)  return next(new AppError('Product not found', 404));
  
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

exports.getLatestProducts = catchAsync(async (req, res, next) => {

  const { limit = 10 } = req.query;
  // "createdAt": "2026-03-06T20:12:32.000Z",
  //   "updatedAt": "2026-03-06T20:12:32.000Z"

  const products = await Product.findAll({
    where: { businessId: req.user.businessId },
    limit: Number(limit),
    order: [['createdAt', 'DESC']],
    include: [
      { model: Category, as: 'category', attributes: ['id','name'] },
      { model: Brand, as: 'brand', attributes: ['id','name'] },
      { model: Unit, as: 'unit', attributes: ['id','name'] }
    ]
  });

  console.log("latest Products",products)

  res.status(200).json({
    status:1,
    message:"Latest products fetched successfully",
    count:products.length,
    data:products
  });

});

exports.getTopSellingProducts = catchAsync(async (req, res, next) => {

  const { limit = 10 } = req.query;

  const products = await SaleItem.findAll({

    attributes:[
      'productId',
      [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold'],
      [Sequelize.fn('SUM', Sequelize.col('unitPrice')), 'pricePerQuantity'],
      [Sequelize.fn('SUM', Sequelize.col('total')), 'totalPrice']
    ],
    include:[
      {
        model: Product,
        as:'product',
        attributes:['id','name','sku','defaultSellingPrice']
      }
    ],

    group:['productId'],
    order:[[Sequelize.literal('totalSold'),'DESC']],
    limit:Number(limit)
  });

  console.log("top SellingProducts",products)

  res.status(200).json({
    status:1,
    message:"Top selling products fetched successfully",
    data:products
  });

});

exports.getProductInsights = catchAsync(async(req,res)=>{

 const {warehouseId,type} = req.query

 const whereStock = {}

 if(warehouseId) whereStock.warehouseId = warehouseId

 if(type === "lowStock"){
  whereStock.quantity = {
   [Op.lte]: Sequelize.col('Product.minimumStock')
  }
 }

 if(type === "deadStock"){
  whereStock.quantity = 0
 }

 const stocks = await Stock.findAll({
  where:whereStock,
  include:[
   {model:Product,as:'product',include:[{model:Category,as:"category"},{model:Brand,as:"brand"}]},
   {model:Warehouse,as:'warehouse'}
  ]
 })

 res.status(200).json({
  status:1,
  results:stocks.length,
  data:stocks
 })

})

// Stock Valuation Report (FIFO / LIFO / Average)
exports.getStockValuation= catchAsync(async (req, res) => {
  const { warehouseId, method = 'FIFO' } = req.query;
  const whereStock = {};
  if (warehouseId) whereStock.warehouseId = warehouseId;

  const stocks = await Stock.findAll({
    where: whereStock,
    include: [{ model: Product,as:"product" }, { model: Warehouse,as:'warehouse'}]
  });

  console.log("stocks",stocks)

  const report = stocks.map(s => {
    let value = 0;
    // Simple valuation: use defaultCostPrice as placeholder
    // Can implement FIFO / LIFO / AVG later
    if (method === 'FIFO' || method === 'LIFO' || method === 'AVERAGE') {
      value = s.quantity * s.Product.defaultCostPrice;
    }
    return {
      productId: s.productId,
      productName: s.Product.name,
      warehouse: s.Warehouse.name,
      stockQuantity: s.quantity,
      stockValue: value
    };
  });

  res.status(200).json({ status: 1, data: report });
});

exports.getProductSummary=catchAsync(async(req,res)=>{
  console.log("this is report for the product")
})

// // Fast / Slow Moving Items
// exports.getFastSlowMovingItems = catchAsync(async (req, res) => {
//   const { startDate, endDate, top = 10 } = req.query;

//   const saleItems = await SaleItem.findAll({
//     include: [Product],
//     where: { createdAt: getDateFilter(startDate, endDate) }
//   });

//   // Aggregate sales quantity per product
//   const productMap = {};
//   saleItems.forEach(si => {
//     if (!productMap[si.productId]) productMap[si.productId] = { productName: si.Product.name, qty: 0 };
//     productMap[si.productId].qty += si.quantity;
//   });

//   const products = Object.values(productMap);
//   const fastMoving = products.sort((a, b) => b.qty - a.qty).slice(0, top);
//   const slowMoving = products.sort((a, b) => a.qty - b.qty).slice(0, top);

//   res.status(200).json({ status: 1, data: { fastMoving, slowMoving } });
// });

exports.importProducts = catchAsync(async (req, res, next) => {
  if (!req.file || !req.file.path) {
    return next(new AppError('File not uploaded or path is invalid.', 400));
  }

  // Only allow Excel files
  if (!req.file.mimetype.includes('spreadsheetml') && !req.file.originalname.endsWith('.xlsx')) {
    return next(new AppError('Please upload a valid Excel file (.xlsx)', 400));
  }
  const requiredFields = [
    'businessId', 'name','sku','partNumber','serialTracking','categoryId','brandId','unitId',
    'defaultCostPrice','defaultSellingPrice','lastPurchaseCost', 'minimumStock',
    'preferredCostMethod','barcode','isActive'
  ];
// console.log("requred fileds",requiredFields)
  // Transform each row before saving
  const transformFn = async (row) => ({
    businessId: row.businessId,
    name:row.name,
    sku:row.sku,
    partNumber:row.partNumber,
    serialTracking:row.serialTracking,
    categoryId:row.categoryId,
    brandId:row.brandId,
    unitId:row.brandId,
    defaultCostPrice:row.defaultCostPrice,
    defaultSellingPrice:row.defaultSellingPrice,
    lastPurchaseCost:row.lastPurchaseCost,
    minimumStock:row.minimumStock,
    preferredCostMethod:row.preferredCostMethod,
    barcode:row.barcode,
    isActive:Boolean(row.isActive),
    image: null
  });


  const saveFn = async (data) => await Product.create(data);
  

  const { importedData, errors } = await importFromExcelFile({
    filePath: req.file.path,
    requiredFields,
    transformFn,
    saveFn
  });

  if (!importedData.length) {
    return next(new AppError('No valid Product were imported from the file.', 400));
  }

  res.status(200).json({
    status: 1,
    message: errors.length > 0 ? 'Import completed with some errors' : 'Data imported successfully',
    successCount: importedData.length,
    errorCount: errors.length,
    errors,
    importedProducts: importedData
  });
});

exports.exportProducts = catchAsync(async (req, res, next) => {
  const { sortBy = "createdAt", sortOrder = "desc", page = 1, limit = 1000 } = req.query;

  const whereQuery = buildUserWhereClause(req.query);

  const validSortColumns = ["createdAt", "updatedAt", "fullName", "email"];
  const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  const products = await Product.findAll({
    where: whereQuery,
    order: [[orderColumn, orderDirection]],
    limit: Number(limit),
    offset: (page - 1) * limit
  });

  if (!products.length) {
    return next(new AppError("No products found for the given filters.", 404));
  }
  
  // Format users for export
  const formattedProducts = products.map(p => ({
    ID: p.id,
    name:p.name,
    sku:p.sku,
    partNumber:p.partNumber,
    serialTracking:p.serialTracking,
    Category:p.categoryId,
    Brand:p.brandId,
    Unit:p.unitId,
    defaultCostPrice:p.defaultCostPrice,
    defaultSellingPrice:p.defaultSellingPrice,
    minimumStock:p.minimumStock,
    Active: p.isActive ? "Yes" : "No"
  }));

  // Define columns for Excel
  const columns = Object.keys(formattedProducts[0]).map(key => ({
    header: key,
    key,
    width: 20
  }));

  // Call generic Excel export
  await exportToExcelFile({
    data: formattedProducts,
    columns,
    fileName: "products",
    res
  });
});

exports.getProductPurchaseHistory = catchAsync(async(req,res)=>{

 const purchases = await PurchaseItem.findAll({
  where:{productId:req.params.productId},
  include:[
   {model:Product,attributes:['id','name']},
   {model:Warehouse}
  ],
  order:[['createdAt','DESC']]
 })

 res.status(200).json({
  status:1,
  results:purchases.length,
  data:purchases
 })

})

exports.getProductSaleHistory = catchAsync(async(req,res)=>{

 const sales = await SaleItem.findAll({
  where:{productId:req.params.productId},
  include:[
   {model:Product,attributes:['id','name']},
   {model:Warehouse}
  ],
  order:[['createdAt','DESC']]
 })

 res.status(200).json({
  status:1,
  results:sales.length,
  data:sales
 })

})