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
 * tags:
 *   - name: Reports
 *     description: Complete reporting module (Sales, Purchase, Stock, Financial, etc.)
 */

/**
 * @swagger
 * /report/sales/summary:
 *   get:
 *     summary: Sales summary report
 *     tags: [Reports]
 */
 
/**
 * @swagger
 * /report/sales/detailed:
 *   get:
 *     summary: Detailed sales report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/sales/by-product:
 *   get:
 *     summary: Sales grouped by product
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/sales/by-customer:
 *   get:
 *     summary: Sales grouped by customer
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/sales/by-status:
 *   get:
 *     summary: Sales grouped by status
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/sales/top-products:
 *   get:
 *     summary: Top selling products
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/sales/top-customers:
 *   get:
 *     summary: Top customers
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/sales/returns:
 *   get:
 *     summary: Sales return report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/sales/payment-methods:
 *   get:
 *     summary: Sales by payment method
 *     tags: [Reports]
 */




/**
 * @swagger
 * /report/purchase/summary:
 *   get:
 *     summary: Purchase summary
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/purchase/detailed:
 *   get:
 *     summary: Detailed purchase report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/purchase/by-product:
 *   get:
 *     summary: Purchase by product
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/purchase/by-supplier:
 *   get:
 *     summary: Purchase by supplier
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/purchase/by-status:
 *   get:
 *     summary: Purchase by status
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/purchase/top-suppliers:
 *   get:
 *     summary: Top suppliers
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/purchase/returns:
 *   get:
 *     summary: Purchase returns
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/purchase/payment-method:
 *   get:
 *     summary: Purchase by payment method
 *     tags: [Reports]
 */




/**
 * @swagger
 * /report/stock/current:
 *   get:
 *     summary: Current stock report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/stock/low:
 *   get:
 *     summary: Low stock report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/stock/dead:
 *   get:
 *     summary: Dead stock report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/stock/fast-moving:
 *   get:
 *     summary: Fast moving stock
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/stock/slow-moving:
 *   get:
 *     summary: Slow moving stock
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/stock/valuation:
 *   get:
 *     summary: Stock valuation report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/stock/transfer-summary:
 *   get:
 *     summary: Stock transfer summary
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/stock/adjustment-summary:
 *   get:
 *     summary: Stock adjustment summary
 *     tags: [Reports]
 */




/**
 * @swagger
 * /report/customer/purchase-history:
 *   get:
 *     summary: Customer purchase history
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/customer/payment:
 *   get:
 *     summary: Customer payment report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/customer/due:
 *   get:
 *     summary: Customer due report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/customer/top:
 *   get:
 *     summary: Top customers
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/customer/returns:
 *   get:
 *     summary: Customer returns
 *     tags: [Reports]
 */




/**
 * @swagger
 * /report/supplier/purchase-history:
 *   get:
 *     summary: Supplier purchase history
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/supplier/payment:
 *   get:
 *     summary: Supplier payment report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/supplier/due:
 *   get:
 *     summary: Supplier due report
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/supplier/returns:
 *   get:
 *     summary: Supplier returns
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/supplier/top:
 *   get:
 *     summary: Top suppliers
 *     tags: [Reports]
 */




/**
 * @swagger
 * /report/user/summary:
 *   get:
 *     summary: User summary report
 *     tags: [Reports]
 */




/**
 * @swagger
 * /report/product:
 *   get:
 *     summary: Product report (multi-type)
 *     description: |
 *       Types:
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
 */




/**
 * @swagger
 * /report/financial:
 *   get:
 *     summary: Financial reports (profit, revenue, expense, collection)
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [profit, revenue, expense, collection]
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month]
 */




/**
 * @swagger
 * /report/warehouse/summary:
 *   get:
 *     summary: Warehouse summary
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/warehouse/detail:
 *   get:
 *     summary: Warehouse detail
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/warehouse/value:
 *   get:
 *     summary: Warehouse stock value
 *     tags: [Reports]
 */

/**
 * @swagger
 * /report/warehouse/transfers:
 *   get:
 *     summary: Warehouse transfers
 *     tags: [Reports]
 */