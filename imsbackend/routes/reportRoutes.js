'use strict';

const express = require('express');
const router = express.Router();

const { requirePermission, authenticationJwt } = require('../utils/authUtils');

const saleReport=require("../report/salesReportsController")
const purchaseReport=require("../report/purchasesReportsController")

const stockReport=require("../report/stockReportController")
const productReport=require("../report/productReportController")

const customerReport=require("../report/customersReportsController")
const supplierReport=require("../report/suppliersReportsController")

const userReport=require("../report/usersReportsController")
const warehouseReport=require("../report/wharehousesReportsController")

const financialReport=require("../report/finanicialReportsController")

router.use(authenticationJwt)

//  ================= SALES =================
router.get('/sales/summary', requirePermission('sales:view'), saleReport.salesSummary);
router.get('/sales/detailed', requirePermission('sales:view'), saleReport.salesDetailed);

router.get('/sales/by-product', requirePermission('sales:view'), saleReport.salesByProduct);
router.get('/sales/by-customer', requirePermission('sales:view'), saleReport.salesByCustomer);
router.get('/sales/by-status', requirePermission('sales:view'), saleReport.salesByStatus);

router.get('/sales/top-products', requirePermission('sales:view'), saleReport.topProducts);
router.get('/sales/top-customers', requirePermission('sales:view'), saleReport.topCustomers);

router.get('/sales/returns', requirePermission('sales:view'), saleReport.salesReturns);
router.get('/sales/payment-methods', requirePermission('sales:view'), saleReport.salesByPaymentMethod);

// ================= PURCHASE REPORTS =================
router.get('/purchase/summary', purchaseReport.purchaseSummary);
router.get('/purchase/detailed', purchaseReport.purchaseDetailed);

router.get('/purchase/by-product', purchaseReport.purchaseByProduct);
router.get('/purchase/by-supplier', purchaseReport.purchaseBySupplier);
router.get('/purchase/by-status', purchaseReport.purchaseByStatus);

router.get('/purchase/top-suppliers', purchaseReport.topSuppliers);

router.get('/purchase/returns', purchaseReport.purchaseReturns);
router.get('/purchase/payment-method', purchaseReport.purchaseByPaymentMethod);

// ================= stock routes =================
router.get('/stock/current', requirePermission('report:view'), stockReport.currentStock);
router.get('/stock/low', requirePermission('report:view'), stockReport.lowStock);
router.get('/stock/dead', requirePermission('report:view'), stockReport.deadStock);

router.get('/stock/fast-moving', requirePermission('report:view'), stockReport.fastMoving);
router.get('/stock/slow-moving', requirePermission('report:view'), stockReport.slowMoving);

router.get('/stock/valuation', requirePermission('report:view'), stockReport.stockValuation);
router.get('/stock/transfer-summary', requirePermission('report:view'), stockReport.transferSummary);
router.get('/stock/adjustment-summary', requirePermission('report:view'), stockReport.adjustmentSummary);

// ================= CUSTOMER REPORT =================
router.get('/customer/purchase-history',requirePermission('report:view'),customerReport.customerPurchaseHistory);
router.get('/customer/payment', requirePermission('report:view'),customerReport.customerPaymentReport);
router.get('/customer/due', requirePermission('report:view'),customerReport.customerDueReport);
router.get('/customer/top',requirePermission('report:view'),customerReport.topCustomers);
router.get('/customer/returns',requirePermission('report:view'),customerReport.customerReturnReport);

// ================= SUPPLIER REPORT =================
router.get('/supplier/purchase-history',requirePermission('report:view'), supplierReport.supplierPurchaseHistory);
router.get('/supplier/payment', requirePermission('report:view'),supplierReport.supplierPaymentReport);
router.get('/supplier/due', requirePermission('report:view'),supplierReport.supplierDueReport);
router.get('/supplier/returns',requirePermission('report:view'), supplierReport.supplierReturnReport);
router.get('/supplier/top', requirePermission('report:view'),supplierReport.topSuppliers);

// ================= USER Reports=================
router.get('/user/summary',requirePermission('report:view'),userReport.getUserSummary);
// router.get('/user/detail',requirePermission('report:view'),userReport.getUserDetail);
// router.get('/user/activity',requirePermission('report:view'),userReport.userActivity);
// router.get('/user/inactive',requirePermission('report:view'),userReport.inactiveUsers);
// router.get('/user/login',requirePermission('report:view'),userReport.loginReport);

// ================= Product Reports=================
router.get('/product',requirePermission('report:view'),productReport.getProductReport);

// // ================= FINANCIAL =================
router.get('/financial', financialReport.getFinancialReport);

// ================= Warehouse Reports=================
router.get('/warehouse/summary', warehouseReport.getWarehouseSummary);
router.get('/warehouse/detail', warehouseReport.getWarehouseDetail);
router.get('/warehouse/value', warehouseReport.getWarehouseStockValue);
router.get('/warehouse/transfers', warehouseReport.getWarehouseTransfers);

module.exports = router;

/**
 * @swagger
 * /report/sales/summary:
 *   get:
 *     summary: Get sales summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales summary data returned
 */

/**
 * @swagger
 * /report/sales/detailed:
 *   get:
 *     summary: Get detailed sales report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sales from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sales until this date
 *     responses:
 *       200:
 *         description: Detailed sales report returned
 */

/**
 * @swagger
 * /report/sales/by-product:
 *   get:
 *     summary: Get sales grouped by product
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top products
 *     responses:
 *       200:
 *         description: Sales grouped by product
 */

/**
 * @swagger
 * /report/sales/by-customer:
 *   get:
 *     summary: Get sales grouped by customer
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sales grouped by customer
 */

/**
 * @swagger
 * /report/sales/by-status:
 *   get:
 *     summary: Get sales grouped by status
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sales grouped by status
 */

/**
 * @swagger
 * /report/sales/top-products:
 *   get:
 *     summary: Get top selling products
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top products list
 */

/**
 * @swagger
 * /report/sales/top-customers:
 *   get:
 *     summary: Get top customers
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top customers list
 */

/**
 * @swagger
 * /report/sales/returns:
 *   get:
 *     summary: Get sales return report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sales returns data
 */

/**
 * @swagger
 * /report/sales/payment-methods:
 *   get:
 *     summary: Get sales by payment method
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sales grouped by payment method
 */

/**
 * @swagger
 * /report/purchase/summary:
 *   get:
 *     summary: Get purchase summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase summary data returned
 */

/**
 * @swagger
 * /report/purchase/detailed:
 *   get:
 *     summary: Get detailed purchase report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Detailed purchase report returned
 */

/**
 * @swagger
 * /report/purchase/by-product:
 *   get:
 *     summary: Get purchase grouped by product
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Purchase data grouped by product
 */

/**
 * @swagger
 * /report/purchase/by-supplier:
 *   get:
 *     summary: Get purchase grouped by supplier
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Purchase data grouped by supplier
 */

/**
 * @swagger
 * /report/purchase/by-status:
 *   get:
 *     summary: Get purchase grouped by status
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Purchase data grouped by status
 */

/**
 * @swagger
 * /report/purchase/top-suppliers:
 *   get:
 *     summary: Get top suppliers
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top suppliers list
 */

/**
 * @swagger
 * /report/purchase/returns:
 *   get:
 *     summary: Get purchase returns
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Purchase return data
 */

/**
 * @swagger
 * /report/purchase/payment-method:
 *   get:
 *     summary: Get purchases by payment method
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Purchases grouped by payment method
 */

/**
 * @swagger
 * /report/stock/current:
 *   get:
 *     summary: Get current stock report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current stock data returned
 */

/**
 * @swagger
 * /report/stock/low:
 *   get:
 *     summary: Get low stock report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock data returned
 */

/**
 * @swagger
 * /report/stock/dead:
 *   get:
 *     summary: Get dead stock report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dead stock data returned
 */

/**
 * @swagger
 * /report/stock/fast-moving:
 *   get:
 *     summary: Get fast moving stock report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fast moving stock data returned
 */

/**
 * @swagger
 * /report/stock/slow-moving:
 *   get:
 *     summary: Get slow moving stock report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slow moving stock data returned
 */

/**
 * @swagger
 * /report/stock/valuation:
 *   get:
 *     summary: Get stock valuation report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock valuation data returned
 */

/**
 * @swagger
 * /report/stock/transfer-summary:
 *   get:
 *     summary: Get stock transfer summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock transfer summary data returned
 */

/**
 * @swagger
 * /report/stock/adjustment-summary:
 *   get:
 *     summary: Get stock adjustment summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock adjustment summary data returned
 */

/**
 * @swagger
 * /report/customer/purchase-history:
 *   get:
 *     summary: Get customer purchase history
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns customer purchase history
 */

/**
 * @swagger
 * /report/customer/payment:
 *   get:
 *     summary: Get customer payment report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns customer payment report
 */

/**
 * @swagger
 * /report/customer/due:
 *   get:
 *     summary: Get customer due report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns customer due report
 */

/**
 * @swagger
 * /report/customer/top:
 *   get:
 *     summary: Get top customers
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns top customers based on purchases
 */

/**
 * @swagger
 * /report/customer/returns:
 *   get:
 *     summary: Get customer return report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns customer returns report
 */


/**
 * @swagger
 * /report/supplier/purchase-history:
 *   get:
 *     summary: Get supplier purchase history
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns supplier purchase history
 */

/**
 * @swagger
 * /report/supplier/payment:
 *   get:
 *     summary: Get supplier payment report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns supplier payment report
 */

/**
 * @swagger
 * /report/supplier/due:
 *   get:
 *     summary: Get supplier due report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns supplier due report
 */

/**
 * @swagger
 * /report/supplier/returns:
 *   get:
 *     summary: Get supplier return report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns supplier returns report
 */

/**
 * @swagger
 * /report/supplier/top:
 *   get:
 *     summary: Get top suppliers
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns top suppliers based on purchase volume
 */

/**
 * @swagger
 * /report/user/summary:
 *   get:
 *     summary: Get user summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns summary of users
 */

/**
 * @swagger
 * /report/product:
 *   get:
 *     summary: Get product report (multi-type)
 *     description: |
 *       This report supports multiple types:
 *       - stock
 *       - low
 *       - out
 *       - sales
 *       - purchase
 *       - top
 *       - slow
 *       - profit
 *       - inactive
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stock, low, out, sales, purchase, top, slow, profit, inactive]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Returns product report
 */

/**
 * @swagger
 * /report/financial:
 *   get:
 *     summary: Get financial reports
 *     description: |
 *       Types: profit, revenue, expense, collection
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [profit, revenue, expense, collection]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month]
 *     responses:
 *       200:
 *         description: Returns financial report
 */

/**
 * @swagger
 * /report/warehouse/summary:
 *   get:
 *     summary: Get warehouse summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns summary of warehouses
 */

/**
 * @swagger
 * /report/warehouse/detail:
 *   get:
 *     summary: Get warehouse detail report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *     responses:
 *       200:
 *         description: Returns detailed warehouse report
 */

/**
 * @swagger
 * /report/warehouse/value:
 *   get:
 *     summary: Get warehouse stock value report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns total stock value per warehouse
 */

/**
 * @swagger
 * /report/warehouse/transfers:
 *   get:
 *     summary: Get warehouse stock transfer report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns warehouse stock transfers
 */