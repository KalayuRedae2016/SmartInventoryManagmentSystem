const {Product, Warehouse,Sale, SaleItem,Customer, User, Stock,StockTransaction } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sequelize = require('../models').sequelize;
const { Op } = require('sequelize');

const getBusinessId = () => 1;

// Calculate sale status
const calculateSaleStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};

const generateInvoiceNumber = () => {
  return 'INV-' + Date.now();
};

const buildSaleWhereClause = (user,query) => {
  const {warehouseId,customerId,minAmount,maxAmount,minPaidAmount,maxPaidAmount,paymentMethod,isActive,startDate,endDate,search,status} = query;

  let whereQuery = { businessId: user.businessId};

  if (isActive !== undefined) whereQuery.isActive = ["true", "1", true, 1].includes(isActive);
  if(warehouseId) whereQuery.warehouseId=categoryId
  if(customerId) whereQuery.customerId=customerId
  
  // totalAmount price range
  if (minAmount || maxAmount) {
    whereQuery.defaultSellingPrice = {};
    if (minAmount) whereQuery.totalAmount[Op.gte] = Number(minAmount);
    if (maxAmount) whereQuery.totalAmount[Op.lte] = Number(maxAmount);
  }

  // padiAmount range
  if (minPaidAmount || maxPaidAmount) {
    whereQuery.defaultCostPrice = {};
    if (minPaidAmount) whereQuery.paidAmount[Op.gte] = Number(minPaidAmount);
    if (maxPaidAmount) whereQuery.paidAmount[Op.lte] = Number(maxPaidAmount);
  }

  if (startDate && endDate) whereQuery.createdAt = {[Op.between]: [new Date(startDate), new Date(endDate)]};
  if(paymentMethod) whereQuery.paymentMethod=paymentMethod
// Search filter
  if (search) {
    whereQuery[Op.or] = [
      { note: { [Op.like]: `%${search}%` } },
    ];
  }
  if(status) whereQuery.status=status

  return whereQuery;
};

// Create a new sale
exports.createSale = catchAsync(async (req, res, next) => {
  const { warehouseId, customerId, invoiceNumber, saleDate, totalAmount,paidAmount,paymentMethod,note } = req.body;
  const businessId = getBusinessId();
  console.log("request bodey",req.body)

  const warehouse = await Warehouse.findByPk(warehouseId);
  if (!warehouse) return next(new AppError('Warehouse not found', 404));

  const customer = await Customer.findByPk(customerId);
  if (!customer) return next(new AppError('Customer not found', 404));

  const total = totalAmount && totalAmount > 0 ? totalAmount : 0;

  let invoiceNum = invoiceNumber;
  if (!invoiceNum) {
    invoiceNum = generateInvoiceNumber();
    console.log("inv",invoiceNum)
    const exists = await Sale.findOne({ where: { invoiceNumber: invoiceNum } });
    if (exists)  invoiceNum = `${invoiceNum}-${Date.now()}`;
  
  }

  if (paidAmount < 0 || paidAmount > total) {
    return next(new AppError('Paid amount cannot be negative or exceed total amount', 400));
  }

  const sale = await Sale.create({
    businessId,
    warehouseId,
    customerId,
    invoiceNumber,
    saleDate:saleDate||new Date(),
    totalAmount:total,
    paidAmount,
    due: totalAmount - paidAmount,
    paymentMethod:paymentMethod || 'cash',
    status: calculateSaleStatus(total, paidAmount),
    note,
    isActive: true,
  });

  res.status(201).json({
    status: 1,
    message: 'Sale created successfully. Now add sale items.',
    data: sale,
  });
});

// Get all sales
exports.getSales = catchAsync(async (req, res, next) => {

  let {page = 1,limit = 10, sortBy = "createdAt",sortOrder = "desc" } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const whereQuery = buildSaleWhereClause(req.user, req.query);

  // Allowed sorting columns
  const validSortColumns = ["createdAt", "updatedAt", "saleDate"];
  const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  const { rows, count } = await Sale.findAndCountAll({
    where: whereQuery,

    include: [
      {model: Customer,as: "customer",attributes: ["id", "name"]},
      {model: Warehouse,as: "warehouse",attributes: ["id", "name"]},
      {model: SaleItem,as: "items",include: [{model: Product,as: "product",attributes: ["id", "name", "sku"]}]}
    ],

    order: [[orderColumn, orderDirection]],

    limit,
    offset: (page - 1) * limit,

    distinct: true
  });

  res.status(200).json({
    status: 1,
    results: rows.length,
    totalRecords: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    limit,
    data: rows
  });

});

// Get sale by id
exports.getSaleById = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.saleId, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Warehouse, as: 'warehouse' },
     {model: SaleItem,as: "items",include: [{model: Product,as: "product",attributes: ["id", "name", "sku"]}]}
    ],
  });

  
  if (!sale) return next(new AppError('Sale not found', 404));

  // Calculate items total from included items
  const itemsTotal = sale.items.reduce(
    (sum, item) => sum + Number(item.total),
    0
  );

  res.status(200).json({
    status: 1,
    data: {
      ...sale.toJSON(),
      itemsTotal,
      remainingDue: sale.dueAmount,
      isLocked: sale.status === 'paid'
    }
  });
});

exports.updateSale = catchAsync(async (req, res, next) => {
   const { warehouseId, customerId, paymentMethod, totalAmount, note } = req.body;
  const sale = await Sale.findByPk(req.params.saleId);
  if (!sale || !sale.isActive) {
    return next(new AppError('Sale not found', 404));
  }
 

  const stockUsed = await StockTransaction.count({
    where: { referenceType: 'SALE', referenceId: sale.id }
  });
  const isLocked = stockUsed > 0;

  // Always editable
  if (note !== undefined) sale.note = note;
  if (paymentMethod !== undefined) sale.paymentMethod = paymentMethod;

  // Editable only if not locked
  if (!isLocked) {
    if (warehouseId !== undefined) sale.warehouseId = warehouseId;
    if (customerId !== undefined) sale.customerId = customerId;
  } else {
    if (warehouseId || customerId) {
      return next(new AppError('Cannot change warehouse or supplier after stock has been created', 400));
    }
  }

  if (totalAmount !== undefined) {
  const itemsTotal = (await PurchaseItem.sum('total', { where: { saleId: sale.id } })) || 0;
  if (itemsTotal > totalAmount) {
    return next(
      new AppError(`Cannot set totalAmount to ${totalAmount}. Items already sum up to ${itemsTotal}`, 400)
    );
  }
  sale.totalAmount = totalAmount;
}


  await sale.save();

  res.status(200).json({
    status: 1,
    message: 'Sale updated successfully',
    data: sale
  });
});

exports.paySale = catchAsync(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return next(new AppError('Invalid payment amount', 400));
  }

  const sale = await Sale.findByPk(req.params.saleId);

  if (!sale) return next(new AppError('Sale not found', 404));

  const totalPaid = Number(sale.paidAmount) + Number(amount);
  

  if (totalPaid > Number(sale.totalAmount)) {
    return next(new AppError(`Payment exceeds total amount,unpaidAmount:${sale.dueAmount}`, 400));
  }

  sale.paidAmount = totalPaid;
  sale.dueAmount = Number(sale.totalAmount) - sale.paidAmount;
  sale.status = calculateSaleStatus(Number(sale.totalAmount), sale.paidAmount);

  await sale.save({ fields: ['paidAmount', 'dueAmount', 'status'] });
  await sale.reload(); // optional: ensure latest DB values

  res.status(200).json({
    status: 1,
    message: 'Payment recorded',
    data: sale,
  });
});

exports.cancelSale = catchAsync(async (req, res, next) => {
  const { ids } = req.body; // expect array of sale IDs
  if (!Array.isArray(ids) || ids.length === 0)
    return next(new AppError('No Sales specified', 400));

  const Sales = await Sale.findAll({
    where: { id: ids, isActive: true }
  });

  for (const sale of Sales) {
    const stockUsed = await StockTransaction.count({
      where: { referenceType: 'SALE', referenceId: sale.id }
    });
    if (stockUsed > 0) continue; // skip locked Sales
    sale.isActive = false;
    await sale.save();
  }

  res.status(200).json({
    status: 1,
    message: 'Selected Sales deleted successfully (skipped locked ones)',
  });
});

exports.deleteSale = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [{ model: SaleItem, as: 'items' }]
  });

  if (!sale) return next(new AppError('Sale not found', 404));

  if (sale.status !== 'pending') {
    return next(new AppError('Only pending sales can be deleted', 400));
  }

  const t = await sequelize.transaction();

  try {
    // Restore stock
    for (const item of sale.items) {
      const stock = await Stock.findOne({
        where: {
          businessId: sale.businessId,
          warehouseId: sale.warehouseId,
          productId: item.productId
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (stock) {
        stock.quantity += item.quantity;
        await stock.save({ transaction: t });
      }

      // Stock history (OUT rollback)
      await StockTransaction.create({
        businessId: sale.businessId,
        warehouseId: sale.warehouseId,
        productId: item.productId,
        type: 'IN',
        quantity: item.quantity,
        referenceType: 'SALE_DELETE',
        referenceId: sale.id,
        note: 'Sale deleted – stock restored'
      }, { transaction: t });
    }

    await SaleItem.destroy({ where: { saleId: sale.id }, transaction: t });
    await sale.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
      status: 1,
      message: 'Sale deleted successfully'
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.deleteSales = catchAsync(async (req, res, next) => {
  const { saleIds } = req.body;
  if (!Array.isArray(saleIds) || !saleIds.length) {
    return next(new AppError('Sale IDs are required', 400));
  }

  const sales = await Sale.findAll({
    where: { id: saleIds, status: 'pending' },
    include: [{ model: SaleItem, as: 'items' }]
  });

  const t = await sequelize.transaction();

  try {
    for (const sale of sales) {
      for (const item of sale.items) {
        const stock = await Stock.findOne({
          where: {
            businessId: sale.businessId,
            warehouseId: sale.warehouseId,
            productId: item.productId
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (stock) {
          stock.quantity += item.quantity;
          await stock.save({ transaction: t });
        }
      }

      await SaleItem.destroy({ where: { saleId: sale.id }, transaction: t });
      await sale.destroy({ transaction: t });
    }

    await t.commit();

    res.status(200).json({
      status: 1,
      message: `${sales.length} sales deleted successfully`
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

//Contorllers for sale items (add/update/delete) - only allowed if sale is not paid
exports.addSaleItem = catchAsync(async (req, res, next) => {
  const saleId=req.params.saleId
  const {productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = req.user.businessId

  const sale = await Sale.findByPk(saleId);
  if (!sale) return next(new AppError('Sale not found or not pending', 400));
  
  if (!productId || !warehouseId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }

  if (quantity <= 0 || unitPrice <= 0) {
    return next(new AppError('Quantity and unit price must be positive', 400));
  }

  const itemTotal = quantity * unitPrice;
  const currentItemsTotal =await SaleItem.sum('total', { where: { saleId } }) || 0;

  if (currentItemsTotal + itemTotal > sale.totalAmount) {
    return next(new AppError('Sale items exceed sale total amount', 400));
  }

  const t = await sequelize.transaction();

  try {
    // 1️⃣ Check stock availability
    const stock = await Stock.findOne({
      where: { businessId, warehouseId, productId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!stock || stock.quantity < quantity) {
      return next(new AppError('Insufficient stock', 400));
    }

    // 2️⃣ Create SaleItem
    const item = await SaleItem.create({
      saleId,
      businessId,
      warehouseId,
      productId,
      quantity,
      unitPrice,
      total: itemTotal
    }, { transaction: t });

    // 3️⃣ Decrease stock
    stock.quantity -= quantity;
    await stock.save({ transaction: t });

    // 4️⃣ Stock history
    await StockTransaction.create({
      businessId,
      warehouseId,
      productId,
      type: 'OUT',
      quantity,
      referenceType: 'SALE',
      referenceId: sale.id,
      performedBy: req.user?.id || null,
      note: `Sale item added (Sale ID: ${sale.id})`
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      status: 1,
      message: 'Sale item added successfully',
      data: item
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.getSaleItems = catchAsync(async (req, res) => {
  const { saleId, page = 1, limit = 10 } = req.query;
  const businessId = getBusinessId();

  const where = { businessId };
  if (saleId) where.saleId = saleId;

  const items = await SaleItem.findAndCountAll({
    where,
    include: [
      { model: Product, as: 'product' },
      { model: Sale, as: 'sale' }
    ],
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 1,
    total: items.count,
    data: items.rows
  });
});

exports.updateSaleItem = catchAsync(async (req, res, next) => {
  const { quantity, unitPrice } = req.body;

  const item = await SaleItem.findByPk(req.params.itemId);
  if (!item) return next(new AppError('Sale item not found', 404));

  const sale = await Sale.findByPk(item.saleId);
  if (!sale || sale.status !== 'pending') {
    return next(new AppError('Sale is locked', 400));
  }

  const newQty = quantity ?? item.quantity;
  const newPrice = unitPrice ?? item.unitPrice;

  if (newQty <= 0 || newPrice <= 0) {
    return next(new AppError('Invalid quantity or price', 400));
  }

  const diffQty = newQty - item.quantity;

  const t = await sequelize.transaction();

  try {
    const stock = await Stock.findOne({
      where: {
        businessId: sale.businessId,
        warehouseId: item.warehouseId,
        productId: item.productId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    // If increasing sale qty → need more stock
    if (diffQty > 0 && (!stock || stock.quantity < diffQty)) {
      return next(new AppError('Insufficient stock', 400));
    }

    // Adjust stock
    if (diffQty !== 0) {
      stock.quantity -= diffQty;
      await stock.save({ transaction: t });

      await StockTransaction.create({
        businessId: sale.businessId,
        warehouseId: item.warehouseId,
        productId: item.productId,
        type: diffQty > 0 ? 'OUT' : 'IN',
        quantity: Math.abs(diffQty),
        referenceType: 'SALE',
        referenceId: sale.id,
        note: 'Sale item updated'
      }, { transaction: t });
    }

    // Update item
    item.quantity = newQty;
    item.unitPrice = newPrice;
    item.total = newQty * newPrice;
    await item.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      status: 1,
      message: 'Sale item updated successfully',
      data: item
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});
exports.deleteSaleItem = catchAsync(async (req, res, next) => {
  const item = await SaleItem.findByPk(req.params.itemId);
  if (!item) return next(new AppError('Sale item not found', 404));

  const sale = await Sale.findByPk(item.saleId);
  if (!sale || sale.status !== 'pending') {
    return next(new AppError('Cannot delete item from locked sale', 400));
  }

  const t = await sequelize.transaction();

  try {
    const stock = await Stock.findOne({
      where: {
        businessId: sale.businessId,
        warehouseId: item.warehouseId,
        productId: item.productId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    // Restore stock
    stock.quantity += item.quantity;
    await stock.save({ transaction: t });

    await StockTransaction.create({
      businessId: sale.businessId,
      warehouseId: item.warehouseId,
      productId: item.productId,
      type: 'IN',
      quantity: item.quantity,
      referenceType: 'SALE',
      referenceId: sale.id,
      note: 'Sale item deleted'
    }, { transaction: t });

    await item.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
      status: 1,
      message: 'Sale item deleted successfully'
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

