const catchAsync = require('../utils/catchAsync');
const { Op, Sequelize } = require('sequelize');

const {Product,Category,Brand,Unit,SaleItem,PurchaseItem,StockAdjustment,StockTransfer,Stock} = require('../models');

const buildDateFilter = (field, startDate, endDate) => {
  if (startDate && endDate) {
    return {
      [field]: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
  }
  return {};
};

exports.getProductReport = catchAsync(async (req, res) => {
  const {
    type,
    startDate,endDate,categoryId,brandId,limit = 5} = req.query;

  const productFilter = {};
  if (categoryId) productFilter.categoryId = categoryId;
  if (brandId) productFilter.brandId = brandId;

  let data;

  switch (type) {

    // ================= STOCK =================
    case 'stock':
      data = await Product.findAll({
        where: productFilter,
        attributes: [
          'id',
          'name',
          'minimumStock',
          'defaultCostPrice',
          [
            Sequelize.fn('SUM', Sequelize.col('stocks.quantity')),
            'totalStock'
          ]
        ],
        include: [
          {
            model: Stock,
            as: 'stocks',
            attributes: []
          }
        ],
        group: ['Product.id'],
        order: [[Sequelize.literal('totalStock'), 'ASC']]
      });
      break;

    // ================= LOW STOCK =================
    case 'low':
      data = await Product.findAll({
        where: productFilter,
        attributes: [
          'id',
          'name',
          'minimumStock',
          [
            Sequelize.fn('SUM', Sequelize.col('stocks.quantity')),
            'totalStock'
          ]
        ],
        include: [
          {
            model: Stock,
            as: 'stocks',
            attributes: []
          }
        ],
        group: ['Product.id'],
        having: Sequelize.literal('totalStock <= minimumStock'),
        order: [[Sequelize.literal('totalStock'), 'ASC']]
      });
      break;

    // ================= OUT OF STOCK =================
    case 'out':
      data = await Product.findAll({
        where: productFilter,
        attributes: [
          'id',
          'name',
          [
            Sequelize.fn('SUM', Sequelize.col('stocks.quantity')),
            'totalStock'
          ]
        ],
        include: [
          {
            model: Stock,
            as: 'stocks',
            attributes: []
          }
        ],
        group: ['Product.id'],
        having: Sequelize.literal('totalStock = 0')
      });
      break;

    // ================= INACTIVE =================
    case 'inactive':
      data = await Product.findAll({
        where: {
          ...productFilter,
          isActive: false
        }
      });
      break;

    // ================= PRICE LIST =================
    case 'price':
      data = await Product.findAll({
        where: productFilter,
        attributes: [
          'id',
          'name',
          'defaultSellingPrice',
          'defaultCostPrice'
        ],
        order: [['name', 'ASC']]
      });
      break;

    // ================= PROFIT =================
    case 'profit':
      data = await Product.findAll({
        where: productFilter,
        attributes: [
          'id',
          'name',
          'defaultSellingPrice',
          'defaultCostPrice',
          [
            Sequelize.literal('(defaultSellingPrice - defaultCostPrice)'),
            'profit'
          ],
          [
            Sequelize.literal(
              '((defaultSellingPrice - defaultCostPrice)/defaultCostPrice)*100'
            ),
            'profitPercent'
          ]
        ],
        order: [[Sequelize.literal('profit'), 'DESC']]
      });
      break;

    // ================= SALES =================
    case 'sales':
      data = await SaleItem.findAll({
        attributes: [
          'productId',
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQty'],
          [Sequelize.fn('SUM', Sequelize.col('total')), 'totalAmount']
        ],
        include: [
          {
            model: Product,as:"product",
            attributes: ['name'],
            where: productFilter
          }
        ],
        where: buildDateFilter('createdAt', startDate, endDate),
        group: ['productId'],
        order: [[Sequelize.literal('totalQty'), 'DESC']]
      });
      break;

    // ================= PURCHASE =================
    case 'purchase':
      data = await PurchaseItem.findAll({
        attributes: [
          'productId',
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQty'],
          [Sequelize.fn('SUM', Sequelize.col('total')), 'totalAmount']
        ],
        include: [
          {
            model: Product,as:"product",
            attributes: ['name'],
            where: productFilter
          }
        ],
        where: buildDateFilter('createdAt', startDate, endDate),
        group: ['productId']
      });
      break;

    // ================= TOP =================
    case 'top':
      data = await SaleItem.findAll({
        attributes: [
          'productId',
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold']
        ],
        include: [
          {
            model: Product,as:"product",
            attributes: ['name'],
            where: productFilter
          }
        ],
        group: ['productId'],
        order: [[Sequelize.literal('totalSold'), 'DESC']],
        limit: parseInt(limit)
      });
      break;

    // ================= SLOW =================
    case 'slow':
      data = await SaleItem.findAll({
        attributes: [
          'productId',
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalSold']
        ],
        include: [
          {
            model: Product,as:"product",
            attributes: ['name'],
            where: productFilter
          }
        ],
        group: ['productId'],
        order: [[Sequelize.literal('totalSold'), 'ASC']],
        limit: parseInt(limit)
      });
      break;

    // ================= adjustment and MOVEMENT =================
    case 'adustment':
      data = await StockAdjustment.findAll({
        where: buildDateFilter('createdAt', startDate, endDate)
      });
      break;
    case 'movement':

    data = await StockTransfer.findAll({
    where: buildDateFilter('createdAt', startDate, endDate)
    });
      break;

    // ================= DEFAULT =================
    default:
      data = await Product.findAll({
        where: productFilter,
        include: [
          { model: Category, as: 'category', attributes: ['name'] },
          { model: Brand, as: 'brand', attributes: ['name'] },
          { model: Unit, as: 'unit', attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']]
      });
  }

  res.json({
    status: 1,
    type,
    count: Array.isArray(data) ? data.length : null,
    data
  });
});