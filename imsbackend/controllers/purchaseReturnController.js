const { PurchaseReturn, PurchaseReturnItem, Purchase, Supplier, Warehouse, Stock, Product ,StockTransaction} = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sequelize = require('../models').sequelize;

const getBusinessId = () => 1;

const calculateStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};

const generateInvoiceNumber = () => {
  return 'PR-' + Date.now();
};

const buildPurchaseReturnWhereClause = (user,query) => {
    const { warehouseId, supplierId, status, startDate, endDate, search, isActive } = query;

  let whereQuery = { businessId: user.businessId};

  if (isActive !== undefined) whereQuery.isActive = ["true", "1", true, 1].includes(isActive);
  if(warehouseId) whereQuery.warehouseId=categoryId
  if(supplierId) whereQuery.supplierId=supplierId
  if(status) whereQuery.status=status
  

  if (startDate && endDate) whereQuery.createdAt = {[Op.between]: [new Date(startDate), new Date(endDate)]};
// Search filter
  if (search) {
    whereQuery[Op.or] = [
      { note: { [Op.like]: `%${search}%` } },
    ];
  }

  return whereQuery;
};

// Helper: calculate remaining returnable amount for a purchase
const getRemainingReturnAmount = async (purchaseId) => {
  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase) return 0;

  const returnedTotal = await PurchaseReturnItem.sum('total', {
    include: [{
      model: PurchaseReturn,as:"purchaseReturn",
      //where: { purchaseId, status: 'completed', isActive: true }
    }]
  }) || 0;

  return purchase.totalAmount - returnedTotal;
};

exports.createPurchaseReturn = catchAsync(async (req, res, next) => {
  const { purchaseId, warehouseId, supplierId, totalAmount, reason } = req.body;
  const businessId = req.user.businessId
  if (!purchaseId || !warehouseId || !supplierId || !reason) {
    return next(new AppError('Missing required fields', 400));
  }

  const purchase = await Purchase.findByPk(purchaseId);
  if (!purchase || !purchase.isActive)    return next(new AppError('Purchase not found', 404));
  
  const purchaseReturn = await PurchaseReturn.create({
    purchaseId,
    businessId,
    warehouseId,
    supplierId,
    totalAmount,
    reason,
    status: 'pending',
    isActive: true,
  });

  res.status(201).json({
    status: 1,
    message: 'Purchase return created successfully',
    data: purchaseReturn,
  });
});

exports.getPurchaseReturns = catchAsync(async (req, res) => {
  const { page = 1, limit = 10} = req.query;
  
  const where = buildPurchaseReturnWhereClause(req.user,req.query);

  const purchaseReturns = await PurchaseReturn.findAndCountAll({
    where,
    include:[
      {model:Purchase,as:'purchase'},
      {model:Supplier,as:'supplier',attributes:['id','name']},
      {model:Warehouse,as:'warehouse',attributes:['id','name']},
      {model:PurchaseReturnItem,as:'items',include:[{model:Product,as:'product',attributes:['id','name','sku']}]}
    ],

    limit:+limit,
    offset:(page-1)*limit,
    order:[['createdAt','DESC']]
  });

  res.status(200).json({
    status: 1,
    message: 'Purchase returns fetched successfully',
    total: purchaseReturns.count,
    data: purchaseReturns.rows,
  });
});

exports.getPurchaseReturnById = catchAsync(async (req, res, next) => {
  const purchaseReturn = await PurchaseReturn.findByPk(req.params.purchaseReturnId, {
    include:[
      {model:Purchase,as:'purchase'},
      {model:Supplier,as:'supplier',attributes:['id','name']},
      {model:Warehouse,as:'warehouse',attributes:['id','name']},
      {model:PurchaseReturnItem,as:'items',include:[{model:Product,as:'product',attributes:['id','name','sku']}]}
    ],
  });

  if (!purchaseReturn || !purchaseReturn.isActive) {
    return next(new AppError('Purchase return not found', 404));
  }

  res.status(200).json({
    status: 1,
    message: 'Purchase return fetched successfully',
    data: purchaseReturn,
  });
});

exports.updatePurchaseReturn = catchAsync(async (req, res, next) => {
  const purchaseReturn = await PurchaseReturn.findByPk(req.params.id);
  if (!purchaseReturn || !purchaseReturn.isActive) {
    return next(new AppError('Purchase return not found', 404));
  }

  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Completed returns cannot be modified', 400));
  }

  const { warehouseId, supplierId, reason, status } = req.body;

  if (warehouseId !== undefined) purchaseReturn.warehouseId = warehouseId;
  if (supplierId !== undefined) purchaseReturn.supplierId = supplierId;
  if (reason !== undefined) purchaseReturn.reason = reason;

  if (status !== undefined) purchaseReturn.status = status;

  await purchaseReturn.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase return updated successfully',
    data: purchaseReturn,
  });
});

// exports.cancelPurchaseReturn = catchAsync(async (req,res,next)=>{

//   const purchaseReturn = await PurchaseReturn.findByPk(req.params.purchaseReturnId,{
//     include:[{model:PurchaseReturnItem,as:'items'}]
//   });

//   if(!purchaseReturn || !purchaseReturn.isActive)
//     return next(new AppError("Purchase return not found",404));

//   const businessId = purchaseReturn.businessId;

//   for(const item of purchaseReturn.items){

//     const stock = await Stock.findOne({
//       where:{
//         businessId,
//         warehouseId:item.warehouseId,
//         productId:item.productId
//       }
//     });

//     if(stock){
//       stock.quantity += item.quantity;
//       await stock.save();
//     }

//     await StockTransaction.create({
//       businessId,
//       warehouseId:item.warehouseId,
//       productId:item.productId,
//       quantity:item.quantity,
//       type:'IN',
//       referenceType:'PURCHASE_RETURN',
//       referenceId:purchaseReturn.id,
//       performedBy:req.user?.id || null,
//       note:`PurchaseReturn canceled (ID:${purchaseReturn.id})`
//     });

//   }

//   purchaseReturn.status='cancelled';
//   purchaseReturn.isActive=false;
//   await purchaseReturn.save();

//   res.status(200).json({
//     status:1,
//     message:"Purchase return cancelled successfully"
//   });

// });

exports.deletePurchaseReturn = catchAsync(async (req, res, next) => {
  const purchaseReturn = await PurchaseReturn.findByPk(req.params.id);
  if (!purchaseReturn || !purchaseReturn.isActive) return next(new AppError('Purchase return not found', 404));

  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Completed returns cannot be deleted', 400));
  }

  purchaseReturn.isActive = false;
  await purchaseReturn.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase return deleted successfully',
  });
});

exports.addPurchaseReturnItem = catchAsync(async (req, res, next) => {
   const purchaseReturnId = req.params.purchaseReturnId;
  const {productId,warehouseId,quantity,unitPrice} = req.body;
  const businessId = req.user.businessId;

  if(!productId || !warehouseId || !quantity || !unitPrice){
    return next(new AppError("Missing required fields",400));
  }

  if (quantity <= 0 || unitPrice <= 0) {
    return next(new AppError('Quantity and unit price must be positive', 400));
  }

  const purchaseReturn = await PurchaseReturn.findByPk(purchaseReturnId);
  if (!purchaseReturn || !purchaseReturn.isActive) {
    return next(new AppError('Purchase return not found', 404));
  }

  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Cannot add items to a completed return', 400));
  }

  console.log("purchasereturn",purchaseReturn.purchaseId)
  const itemTotal = quantity * unitPrice;
  const remaining = await getRemainingReturnAmount(purchaseReturn.purchaseId);
  if (itemTotal > remaining) {
    return next(new AppError(`Item total (${itemTotal}) exceeds remaining purchase amount (${remaining})`, 400));
  }

  const t = await sequelize.transaction();

  try {
    const item = await PurchaseReturnItem.create(
      {
        purchaseReturnId,
        businessId,
        warehouseId,
        productId,
        quantity,
        unitPrice,
        total: itemTotal,
      },
      { transaction: t }
    );

    // 2️⃣ Update PurchaseReturn totalAmount
    purchaseReturn.totalAmount += itemTotal; // optional, if you track running total
    await purchaseReturn.save({ transaction: t });

    // 3️⃣ Update Stock (UPSERT logic, decrease stock for return)
    const [stock] = await Stock.findOrCreate({
      where: { businessId, warehouseId, productId },
      defaults: { quantity: 0 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    stock.quantity -= quantity; // decrease stock because return removes items
    await stock.save({ transaction: t });

    // 4️⃣ Optional: Insert StockTransaction for history
    await StockTransaction.create(
      {
        businessId,
        warehouseId,
        productId,
        type: 'OUT', // out because items returned to supplier
        quantity,
        referenceType: 'PURCHASE_RETURN',
        referenceId: purchaseReturn.id,
        performedBy: req.user?.id || null,
        note: `PurchaseReturnItem added (Return ID: ${purchaseReturn.id})`,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      status: 1,
      message: 'Purchase return item added successfully',
      data: item,
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.getPurchaseReturnsItems = catchAsync(async (req, res) => {
  const { purchaseReturnId, page = 1, limit = 10 } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (purchaseReturnId) where.purchaseReturnId = purchaseReturnId;

  const items = await PurchaseReturnItem.findAndCountAll({
    where,
    include: [{ model: Product, as: 'product' }],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    message: 'Purchase return items fetched successfully',
    result: items.count,
    data: items.rows,
  });
});

exports.updatePurchaseReturnItem = catchAsync(async (req, res, next) => {
  const { quantity, unitPrice, warehouseId, productId } = req.body;
  const businessId = getBusinessId();

  // 1️⃣ Fetch the item
  const item = await PurchaseReturnItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Purchase return item not found', 404));

  // 2️⃣ Fetch related purchase return
  const purchaseReturn = await PurchaseReturn.findByPk(item.purchaseReturnId);
  if (!purchaseReturn || !purchaseReturn.isActive) return next(new AppError('Purchase return not found', 404));

  if (purchaseReturn.status === 'completed') {
    return next(new AppError('Cannot modify items of a completed return', 400));
  }

  // 3️⃣ Validate input
  if (quantity !== undefined && quantity <= 0) return next(new AppError('Quantity must be positive', 400));
  if (unitPrice !== undefined && unitPrice <= 0) return next(new AppError('Unit price must be positive', 400));

  // 4️⃣ Calculate new total
  const newQuantity = quantity !== undefined ? quantity : item.quantity;
  const newUnitPrice = unitPrice !== undefined ? unitPrice : item.unitPrice;
  const newTotal = newQuantity * newUnitPrice;

  // Check remaining purchase amount
  const otherItemsTotal = (await PurchaseReturnItem.sum('total', {
    where: { purchaseReturnId: purchaseReturn.id, id: { [Op.ne]: item.id } }
  })) || 0;

  const remaining = await getRemainingReturnAmount(purchaseReturn.purchaseId);
  if (otherItemsTotal + newTotal > remaining) {
    return next(new AppError(`Updating this item exceeds remaining purchase amount (${remaining})`, 400));
  }

  // 🔐 TRANSACTION START
  const t = await sequelize.transaction();

  try {
    // 5️⃣ Update stock if quantity changed
    const diffQuantity = newQuantity - item.quantity; // positive = increase, negative = decrease

    if (diffQuantity !== 0) {
      const [stock] = await Stock.findOrCreate({
        where: { businessId, warehouseId: item.warehouseId, productId: item.productId },
        defaults: { quantity: 0 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      stock.quantity -= diffQuantity; // decrease stock for return items
      await stock.save({ transaction: t });

      // Optional: update stock transaction history
      await StockTransaction.create({
        businessId,
        warehouseId: item.warehouseId,
        productId: item.productId,
        type: 'OUT',
        quantity: diffQuantity,
        referenceType: 'PURCHASE_RETURN',
        referenceId: purchaseReturn.id,
        performedBy: req.user?.id || null,
        note: `PurchaseReturnItem updated (Return ID: ${purchaseReturn.id})`,
      }, { transaction: t });
    }

    // 6️⃣ Update item
    item.quantity = newQuantity;
    item.unitPrice = newUnitPrice;
    item.total = newTotal;
    await item.save({ transaction: t });

    // 7️⃣ Update purchaseReturn totalAmount if you track running total
    purchaseReturn.totalAmount = otherItemsTotal + newTotal;
    await purchaseReturn.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      status: 1,
      message: 'Purchase return item updated successfully',
      data: item,
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.deletePurchaseReturnItem = catchAsync(async (req, res, next) => {
  const item = await PurchaseReturnItem.findByPk(req.params.id);
  if (!item) return next(new AppError('Purchase return item not found', 404));

  const purchaseReturn = await PurchaseReturn.findByPk(item.purchaseReturnId);
  if (!purchaseReturn || !purchaseReturn.isActive) return next(new AppError('Purchase return not found', 404));
  if (purchaseReturn.status === 'completed') return next(new AppError('Cannot delete items of a completed return', 400));

  const businessId = getBusinessId();

  // 🔐 TRANSACTION START
  const t = await sequelize.transaction();

  try {
    // 1️⃣ Update stock (increase stock back since return item is removed)
    const [stock] = await Stock.findOrCreate({
      where: { businessId, warehouseId: item.warehouseId, productId: item.productId },
      defaults: { quantity: 0 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    stock.quantity += item.quantity; // return the items to stock
    await stock.save({ transaction: t });

    // 2️⃣ Optional: record in StockTransaction for history
    await StockTransaction.create({
      businessId,
      warehouseId: item.warehouseId,
      productId: item.productId,
      type: 'IN', // reversing the return
      quantity: item.quantity,
      referenceType: 'PURCHASE_RETURN',
      referenceId: purchaseReturn.id,
      performedBy: req.user?.id || null,
      note: `PurchaseReturnItem deleted (Return ID: ${purchaseReturn.id})`,
    }, { transaction: t });

    // 3️⃣ Delete the item
    await item.destroy({ transaction: t });

    // 4️⃣ Update purchaseReturn totalAmount
    const remainingItemsTotal = (await PurchaseReturnItem.sum('total', {
      where: { purchaseReturnId: purchaseReturn.id },
      transaction: t,
    })) || 0;

    purchaseReturn.totalAmount = remainingItemsTotal;
    await purchaseReturn.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      status: 1,
      message: 'Purchase return item deleted successfully',
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.deleteAllPurchaseReturnItems = catchAsync(async (req, res, next) => {
  const purchaseReturn = await PurchaseReturn.findByPk(req.params.purchaseReturnId);
  if (!purchaseReturn || !purchaseReturn.isActive) return next(new AppError('Purchase return not found', 404));
  if (purchaseReturn.status === 'completed') return next(new AppError('Cannot delete items of a completed return', 400));

  const businessId = getBusinessId();

  // 🔐 TRANSACTION START
  const t = await sequelize.transaction();

  try {
    const items = await PurchaseReturnItem.findAll({
      where: { purchaseReturnId: purchaseReturn.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    for (const item of items) {
      // 1️⃣ Update stock
      const [stock] = await Stock.findOrCreate({
        where: { businessId, warehouseId: item.warehouseId, productId: item.productId },
        defaults: { quantity: 0 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      stock.quantity += item.quantity;
      await stock.save({ transaction: t });

      // 2️⃣ Optional: StockTransaction history
      await StockTransaction.create({
        businessId,
        warehouseId: item.warehouseId,
        productId: item.productId,
        type: 'IN',
        quantity: item.quantity,
        referenceType: 'PURCHASE_RETURN',
        referenceId: purchaseReturn.id,
        performedBy: req.user?.id || null,
        note: `PurchaseReturnItem deleted (Return ID: ${purchaseReturn.id})`,
      }, { transaction: t });

      // 3️⃣ Delete the item
      await item.destroy({ transaction: t });
    }

    // 4️⃣ Update purchaseReturn totalAmount
    purchaseReturn.totalAmount = 0;
    await purchaseReturn.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      status: 1,
      message: 'All purchase return items deleted successfully',
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});
