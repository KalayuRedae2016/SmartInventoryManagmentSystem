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
//.....Controller for SaleItems.....//.
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
    return next(new AppError('Sale not found or not pending', 404));
  }

  const itemTotal = quantity * unitPrice;
  const currentItemsTotal =
    (await SaleItem.sum('total', { where: { saleId } })) || 0;

  if (currentItemsTotal + itemTotal > sale.totalAmount) {
    return next(
      new AppError('Adding this item exceeds sale total amount', 400)
    );
  }

  // 🔐 TRANSACTION START
  const t = await sequelize.transaction();

  try {
    // 1️⃣ Create PurchaseItem
    const item = await SaleItem.create(
      {
        saleId,
        businessId,
        warehouseId,
        productId,
        quantity,
        unitPrice,
        total: itemTotal,
      },
      { transaction: t }
    );

    // 2️⃣ Update Sale financials
    sale.dueAmount = sale.totalAmount - sale.paidAmount;
    sale.status = calculateStatus(
      sale.totalAmount,
      sale.paidAmount
    );
    await sale.save({ transaction: t });

    // 3️⃣ Update Stock (UPSERT logic)
    const [stock] = await Stock.findOrCreate({
      where: { businessId, warehouseId, productId },
      defaults: { quantity: 0 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    stock.quantity += quantity;
    await stock.save({ transaction: t });

    // 4️⃣ Insert StockTransaction (history)
    await StockTransaction.create(
      {
        businessId,
        warehouseId,
        productId,
        type: 'Out',
        quantity,
        referenceType: 'Sale',
        referenceId: sale.id,
        performedBy: req.user?.id || null,
        note: `PurchaseItem added (Purchase ID: ${sale.id})`,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      status: 1,
      message: 'Purchase item added successfully',
      data: item,
    });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.getSaleItems = catchAsync(async (req, res) => {
  console.log("reched this endpoint")
  const { purchaseId, page = 1, limit = 10 } = req.query;
  const businessId = getBusinessId();
  const where = { businessId };
  if (purchaseId) where.purchaseId = purchaseId;

  const items = await PurchaseItem.findAndCountAll({
    where,
    include: [
       {model: Product, as: 'product' },
       {model: Purchase, as: 'purchase' },
    ],
    
    limit: +limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 1,
    message: 'Purchase items fetched successfully',
    result: items.count,
    data: items.rows,
  });
});

exports.updateSaleItem = catchAsync(async (req, res, next) => {
  const { quantity, unitPrice, warehouseId, productId } = req.body;
  const businessId = getBusinessId();

  // 1️⃣ Fetch the item
  const item = await SaleItem.findByPk(req.params.itemId);
  if (!item) return next(new AppError('Sale item not found', 404));

  // 2️⃣ Fetch the related sale
  const sale = await Sale.findByPk(item.saleId);
  if (!sale || !sale.isActive) return next(new AppError('Sale not found', 404));

  // 3️⃣ Check if stock already exists for this purchase (locked fields)
  const stockUsed = await StockTransaction.count({
    where: { referenceType: 'PURCHASE', referenceId: purchase.id }
  });
  const isLocked = stockUsed > 0;

  // 4️⃣ Validate new values
  let newQuantity = quantity !== undefined ? quantity : item.quantity;
  let newUnitPrice = unitPrice !== undefined ? unitPrice : item.unitPrice;
  if (newQuantity <= 0) return next(new AppError('Quantity must be positive', 400));
  if (newUnitPrice <= 0) return next(new AppError('Unit price must be positive', 400));

  const newTotal = newQuantity * newUnitPrice;

  const otherItemsTotal = (await PurchaseItem.sum('total', {
    where: { purchaseId: purchase.id, id: { [Op.ne]: item.id } }
  })) || 0;

  if (otherItemsTotal + newTotal > purchase.totalAmount) {
    return next(new AppError(`Updating this item exceeds purchase total amount (${purchase.totalAmount})`, 400));
  }

  // 5️⃣ Update editable fields
  if (!isLocked) {
    if (warehouseId !== undefined) item.warehouseId = warehouseId;
    if (productId !== undefined) item.productId = productId;
  } else {
    if (warehouseId || productId) return next(new AppError('Cannot change warehouse or product after stock is created', 400));
  }

  // 6️⃣ Calculate quantity difference for stock adjustment
  const diffQuantity = newQuantity - item.quantity;

  item.quantity = newQuantity;
  item.unitPrice = newUnitPrice;
  item.total = newTotal;
  await item.save();

  // 7️⃣ Update purchase financials
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
  await purchase.save();

  // 8️⃣ Adjust stock and stock transaction if quantity changed
  if (diffQuantity !== 0) {
    let stock = await Stock.findOne({
      where: { businessId, warehouseId: item.warehouseId, productId: item.productId }
    });
    if (stock) {
      stock.quantity += diffQuantity;
      await stock.save();
    } else {
      await Stock.create({
        businessId,
        warehouseId: item.warehouseId,
        productId: item.productId,
        quantity: diffQuantity,
        name: '', // optional
        stockAlert: 0,
        description: 'Stock from updated purchase item',
      });
    }

    await StockTransaction.create({
      businessId,
      warehouseId: item.warehouseId,
      productId: item.productId,
      quantity: diffQuantity,
      type: 'IN',
      referenceType: 'PURCHASE',
      referenceId: purchase.id,
      performedBy: req.user?.id || null,
      note: `PurchaseItem updated (Purchase ID: ${purchase.id})`,
      valueDate: new Date(),
    });
  }

  res.status(200).json({
    status: 1,
    message: 'Purchase item updated successfully',
    data: item,
  });
});

exports.deleteSaleItem = catchAsync(async (req, res, next) => {
  const item = await PurchaseItem.findByPk(req.params.itemId);
  if (!item) return next(new AppError('Purchase item not found', 404));

  const purchase = await Purchase.findByPk(item.purchaseId);
  if (!purchase || !purchase.isActive) return next(new AppError('Purchase not found', 404));
  if (purchase.status === 'paid') return next(new AppError('Cannot delete item of paid purchase', 400));

  const businessId = purchase.businessId;

  // 1️⃣ Adjust stock
  const stock = await Stock.findOne({
    where: { businessId, warehouseId: item.warehouseId, productId: item.productId }
  });

  if (stock) {
    stock.quantity -= item.quantity;
    if (stock.quantity < 0) stock.quantity = 0; // prevent negative stock
    await stock.save();
  }

  // 2️⃣ Record StockTransaction
  await StockTransaction.create({
    businessId,
    warehouseId: item.warehouseId,
    productId: item.productId,
    quantity: item.quantity,
    type: 'OUT',
    referenceType: 'PURCHASE',
    referenceId: purchase.id,
    performedBy: req.user?.id || null,
    note: `PurchaseItem deleted (Purchase ID: ${purchase.id})`,
    valueDate: new Date(),
  });

  // 3️⃣ Delete the PurchaseItem
  await item.destroy();

  // 4️⃣ Update purchase financials (do NOT reduce totalAmount)
  purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
  purchase.status = calculateStatus(purchase.totalAmount, purchase.paidAmount);
  await purchase.save();

  res.status(200).json({
    status: 1,
    message: 'Purchase item deleted successfully',
  });
});

exports.deleteAllSales = catchAsync(async (req, res, next) => {
  // 1️⃣ Fetch all active sales
  const sales = await Sale.findAll({ where: { isActive: true } });
  if (!sales.length) return next(new AppError('No active sales found', 404));

  for (const sale of sales) {
    // Skip fully paid sales
    if (sale.status === 'paid') continue;

    const saleItems = await SaleItem.findAll({ where: { saleId: sale.id } });

    for (const item of saleItems) {
      // Adjust stock
      const stock = await Stock.findOne({
        where: { businessId: sale.businessId, warehouseId: item.warehouseId, productId: item.productId }
      });
      if (stock) {
        stock.quantity -= item.quantity;
        if (stock.quantity < 0) stock.quantity = 0;
        await stock.save();
      }

      // Record stock transaction
      await StockTransaction.create({
        businessId: sale.businessId,
        warehouseId: item.warehouseId,
        productId: item.productId,
        quantity: item.quantity,
        type: 'OUT',
        referenceType: 'SALE',
        referenceId: sale.id,
        performedBy: req.user?.id || null,
        note: `SaleItem deleted (Sale ID: ${sale.id})`,
        valueDate: new Date(),
      });

      // Delete sale item
      await item.destroy();
    }

    // Soft delete the sale
    sale.isActive = false;
    await sale.save();
  }

  res.status(200).json({
    status: 1,
    message: 'All eligible purchases deleted successfully',
  });
});
