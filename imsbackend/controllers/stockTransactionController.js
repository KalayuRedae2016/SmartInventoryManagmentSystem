const { StockTransaction, Product, Warehouse, User } = require('../models');
const catchAsync = require('../utils/catchAsync');

const getBusinessId = () => 1;

const buildQuery = (user,query) => {
  const {warehouseId,productId,type,referenceType,minQuantity,maxQuantity,search,performedBy,startDate,endDate,} = query;

  let whereQuery = { businessId: user.businessId};

  if(warehouseId) whereQuery.warehouseId=warehouseId
  if(productId) whereQuery.productId=productId
  if(performedBy) whereQuery.performedBy=performedBy

  if(minQuantity||maxQuantity){
    whereQuery.quantity={}
    if (minQuantity) whereQuery.paidAmount[Op.gte] = Number(minQuantity);
    if (maxQuantity) whereQuery.paidAmount[Op.lte] = Number(maxQuantity);
  }

  if (startDate && endDate) whereQuery.createdAt = {[Op.between]: [new Date(startDate), new Date(endDate)]};
  if(type) whereQuery.type=type
  if(referenceType) whereQuery.referenceType=referenceType

  if (search) {
    whereQuery[Op.or] = [
      { note: { [Op.like]: `%${search}%` } },
    ];
  }

  return whereQuery;
};

/**
 * Create a stock transaction (called internally from other controllers)
 * type: 'IN', 'OUT', 'TRANSFER', 'ADJUST'
 * referenceType: 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER'
 */

exports.createStockTransaction = catchAsync(async ({
  businessId,
  warehouseId,
  productId,
  type,
  quantity,
  referenceType,
  referenceId,
  performedBy,
  note
}) => {
  return await StockTransaction.create({
    businessId,
    warehouseId,
    productId,
    type,
    quantity,
    referenceType,
    referenceId,
    performedBy,
    note
  });
});

exports.getStockTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const where = buildQuery(req.user,req.query)

  const transactions = await StockTransaction.findAndCountAll({
    where,
    include: [
      { model: Product, as: 'product' ,attributes:['id',"name"]},
      { model: Warehouse, as: 'warehouse',attributes:["id","name"] },
      { model: User, as: 'user',attributes:["id","fullName"] },
      ],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    total: transactions.count,
    data: transactions.rows,
  });
});

exports.getStockTransaction = catchAsync(async (req, res) => {
 
  const transactionId=req.params.transactionId
  const transaction=await StockTransaction.findByPk(transactionId,
    { 
      include: [
      { model: Product, as: 'product' ,attributes:['id',"name"]},
      { model: Warehouse, as: 'warehouse',attributes:["id","name"] },
      { model: User, as: 'user',attributes:["id","fullName"] },
      ],
    });

  res.status(200).json({
    status: 1,
    data: transaction
  });
});

exports.exportStockTransactions = catchAsync(async (req, res) => {
  // implement export logic
  res.status(200).json({
    status: 1,
    message: 'Stock transaction report generated successfully',
  });
});
