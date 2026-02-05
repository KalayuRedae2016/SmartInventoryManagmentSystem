const {Product, Warehouse,Sale, SaleItem,Customer, User, Stock } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getBusinessId = () => 1;

// Calculate sale status
const calculateSaleStatus = (total, paid) => {
  if (paid <= 0) return 'pending';
  if (paid < total) return 'partial';
  return 'paid';
};

      // businessId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      // warehouseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      // customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      // invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      // saleDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      // totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      // paidAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      // dueAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      // paymentMethod: { type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_payment'), allowNull: true },
      // status: { type: DataTypes.ENUM('pending', 'partial', 'paid'), allowNull: false, defaultValue: 'pending' },
      // note: { type: DataTypes.STRING, allowNull: true },
      // isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

// Create a new sale
exports.createSale = catchAsync(async (req, res, next) => {
  const { warehouseId, customerId, invoiceNumber, saleDate, totalAmount,paidAmount,paymentMethod,note } = req.body;
  const businessId = getBusinessId();
  console.log("request bodey",req.body)

  if (!warehouseId || !customerId || !invoiceNumber || !saleDate||!totalAmount||!paidAmount||!paymentMethod) {
    return next(new AppError('Missing required fields', 400));
  }

  const sale = await Sale.create({
    businessId,
    warehouseId,
    customerId,
    invoiceNumber,
    saleDate,
    totalAmount,
    paidAmount,
    due: totalAmount - paidAmount,
    paymentMethod,
    status: calculateSaleStatus(totalAmount, paidAmount),
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
  const {page = 1,limit = 10,warehouseId,customerId,status,isActive,search,sortBy = 'createdAt',sortOrder = 'desc'} = req.query;

  const businessId = getBusinessId();

  const whereQuery = { businessId};

  // Filters
  if (warehouseId) whereQuery.warehouseId = warehouseId;
  if (customerId) whereQuery.customerId = customerId;
  if (status) whereQuery.status = status;
  if(isActive) whereQuery.isActive=isActive

  // Search (ONLY string/date fields)
  if (search) {
    whereQuery[Op.or] = [
      { invoiceNumber: { [Op.like]: `%${search}%` } },
      { paymentMethod: { [Op.like]: `%${search}%` } },
      { note: { [Op.like]: `%${search}%` } },
    ];
  }

  // Sorting
  const validSortColumns = ['createdAt', 'updatedAt', 'saleDate'];
  const orderColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Pagination
  const offset = (page - 1) * limit;

  const { rows, count } = await Sale.findAndCountAll({
    where: whereQuery,
    include: [
      { model: Customer, as: 'customer' },
      { model: Warehouse, as: 'warehouse' },
    ],
    order: [[orderColumn, orderDirection]],
    limit: +limit,
    offset,
  });

  res.status(200).json({
    status: 1,
    total: count,
    page: +page,
    limit: +limit,
    data: rows,
  });
});

// Get sale by id
exports.getSaleById = catchAsync(async (req, res, next) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Warehouse, as: 'warehouse' },
      { model: SaleItem, as: 'items' }
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
  const sale = await Sale.findByPk(req.params.id);
  if (!sale) return next(new AppError('Sale not found', 404));

  if (sale.status === 'paid') {
    return next(new AppError('Paid sale cannot be updated', 400));
  }

  const { paidAmount, note, paymentMethod, saleDate } = req.body;

  if (paidAmount !== undefined) {
    if (paidAmount < sale.paidAmount) {
      return next(new AppError('Paid amount cannot be reduced', 400));
    }
    sale.paidAmount = paidAmount;
  }

  if (note) sale.note = note;
  if (paymentMethod) sale.paymentMethod = paymentMethod;
  if (saleDate) sale.saleDate = saleDate;

  // Recalculate due & status
  sale.dueAmount = sale.totalAmount - sale.paidAmount;

  sale.status =
    sale.paidAmount === 0 ? 'pending' :
    sale.paidAmount < sale.totalAmount ? 'partial' :
    'paid';

  await sale.save();

  res.status(200).json({
    status: 1,
    message: 'Sale updated successfully',
    data: sale
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
exports.createSaleItem = catchAsync(async (req, res, next) => {
  const { saleId, productId, warehouseId, quantity, unitPrice } = req.body;
  const businessId = getBusinessId();

  if (!saleId || !productId || !warehouseId || !quantity || !unitPrice) {
    return next(new AppError('Missing required fields', 400));
  }

  if (quantity <= 0 || unitPrice <= 0) {
    return next(new AppError('Quantity and unit price must be positive', 400));
  }

  const sale = await Sale.findByPk(saleId);
  if (!sale || sale.status !== 'pending') {
    return next(new AppError('Sale not found or not pending', 400));
  }

  const itemTotal = quantity * unitPrice;

  const currentItemsTotal =
    (await SaleItem.sum('total', { where: { saleId } })) || 0;

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

