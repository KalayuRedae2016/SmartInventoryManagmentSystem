'use strict';

const express = require('express');
const router = express.Router();

const { requirePermission, authenticationJwt } = require('../utils/authUtils');
const reportController=require("../controllers/reportController")

router.use(authenticationJwt)

// // ================= inventory/stock routes =================
// router.get('stock/current-stock', requirePermission('report:view'), reportController.currentStock);
// router.get('stock/stock-valuation', requirePermission('report:view'), reportController.stockValuation);
// router.get('stock/low-stock', requirePermission('report:view'), reportController.lowStock);
// router.get('stock/dead-stock', requirePermission('report:view'), reportController.deadStock);
// router.get('stock/fast-moving', requirePermission('report:view'), reportController.fastMoving);
// router.get('stock/slow-moving', requirePermission('report:view'), reportController.slowMoving);
// router.get('stock/dead-stock', requirePermission('report:view'), reportController.deadStock);

// // Stock Transfers
// router.get('/transfers/summary', requirePermission('stock:view'), reportController.transferSummary);
// router.get('/transfers/detailed', requirePermission('stock:view'), inventoryReportContoller.transferDetailed);
// // Stock Adjustments
// router.get('/adjustments/summary', requirePermission('stock:view'), inventoryReportContoller.adjustmentSummary);
// router.get('/adjustments/detailed', requirePermission('stock:view'), inventoryReportContoller.adjustmentDetailed);

// //  ================= SALES =================
// router.get('/summary', requirePermission('sales:view'), reportController.summary);
// router.get('/detailed', requirePermission('sales:view'), reportController.detailed);
// router.get('/by-product', requirePermission('sales:view'), reportController.byProduct);
// router.get('/by-status', requirePermission('sales:view'), reportController.byStatus);
// router.get('/returns', requirePermission('sales:view'), reportController.returns);
// router.get('/top-customers', requirePermission('sales:view'), reportController.topCustomers);

// // ================= PURCHASE =================
// router.get('/summary', requirePermission('purchase:view'), reportController.summary);
// router.get('/detailed', requirePermission('purchase:view'), reportController.detailed);
// router.get('/by-supplier', requirePermission('purchase:view'), reportController.bySupplier);
// router.get('/returns', requirePermission('purchase:view'), reportController.returns);
// router.get('/top-suppliers', requirePermission('purchase:view'), reportController.topSuppliers);

// // // ================= USER & AUDIT =================
// router.get('/user/summary', requirePermission('report:view'), reportController.getUserSummary);
// router.get('/user/detail', requirePermission('report:view'), reportController.getUserDetail);
// router.get('/user/activity', requirePermission('report:view'), reportController.userActivity);
// router.get('/user/login', requirePermission('report:view'), reportController.loginReport);

// // ================= RETURNS =================
// router.get('/returns/purchase', requirePermission('report:view'), reportController.purchaseReturnReport);
// router.get('/returns/sales', requirePermission('report:view'), reportController.salesReturnReport);
// router.get('/returns/reason-analysis', requirePermission('report:view'), reportController.returnReasonAnalysis);

// // ================= FINANCIAL =================
// router.get('/financial/profit-loss', requirePermission('report:view'), reportController.profitLoss);
// router.get('/financial/receivable', requirePermission('report:view'), reportController.receivableReport);
// router.get('/financial/payable', requirePermission('report:view'), reportController.payableReport);

// // ================= WAREHOUSE =================
// router.get('/warehouse/stock', requirePermission('report:view'), reportController.stockPerWarehouse);

// // ================= TRANSFER =================
// router.get('/transfer', requirePermission('report:view'), reportController.transferReport);

// // ================= ADJUSTMENT =================
// router.get('/adjustment', requirePermission('report:view'), reportController.adjustmentReport);

// // ================= CUSTOMER =================
// router.get('/customer', requirePermission('report:view'), reportController.customerDetailed);
// router.get('/customer/top', requirePermission('report:view'), reportController.topCustomers);

// // ================= SUPPLIER =================
// router.get('/supplier', requirePermission('report:view'), reportController.supplierDetailed);
// router.get('/supplier/top', requirePermission('report:view'), reportController.topSuppliers);

module.exports = router;
;
