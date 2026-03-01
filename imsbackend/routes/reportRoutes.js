'use strict';

const express = require('express');
const router = express.Router();

const { requirePermission, authenticationJwt } = require('../utils/authUtils');
const inventoryReportContoller=require("../controllers/report/inventoryReportController")
const salesReportsController=require("../controllers/report/salesReportsController")
const purchasesReportsController=require("../controllers/report/purchasesReportsController");
const userReportsController=require("../controllers/report/usersReportsController")

router.use(authenticationJwt)

// ================= inventory/stock routes =================
router.get('stock/current-stock', requirePermission('report:view'), inventoryReportContoller.currentStock);
router.get('stock/stock-valuation', requirePermission('report:view'), inventoryReportContoller.stockValuation);
router.get('stock/low-stock', requirePermission('report:view'), inventoryReportContoller.lowStock);
router.get('stock/dead-stock', requirePermission('report:view'), inventoryReportContoller.deadStock);
router.get('stock/fast-moving', requirePermission('report:view'), inventoryReportContoller.fastMoving);
router.get('stock/slow-moving', requirePermission('report:view'), inventoryReportContoller.slowMoving);
router.get('stock/dead-stock', requirePermission('report:view'), inventoryReportContoller.deadStock);
// Stock Transfers
router.get('/transfers/summary', requirePermission('stock:view'), inventoryReportContoller.transferSummary);
router.get('/transfers/detailed', requirePermission('stock:view'), inventoryReportContoller.transferDetailed);
// Stock Adjustments
router.get('/adjustments/summary', requirePermission('stock:view'), inventoryReportContoller.adjustmentSummary);
router.get('/adjustments/detailed', requirePermission('stock:view'), inventoryReportContoller.adjustmentDetailed);


//  ================= SALES =================
router.get('/summary', requirePermission('sales:view'), salesReportsController.summary);
router.get('/detailed', requirePermission('sales:view'), salesReportsController.detailed);
router.get('/by-product', requirePermission('sales:view'), salesReportsController.byProduct);
router.get('/by-status', requirePermission('sales:view'), salesReportsController.byStatus);
router.get('/returns', requirePermission('sales:view'), salesReportsController.returns);
router.get('/top-customers', requirePermission('sales:view'), salesReportsController.topCustomers);

// ================= PURCHASE =================
router.get('/summary', requirePermission('purchase:view'), purchasesReportsController.summary);
router.get('/detailed', requirePermission('purchase:view'), purchasesReportsController.detailed);
router.get('/by-supplier', requirePermission('purchase:view'), purchasesReportsController.bySupplier);
router.get('/returns', requirePermission('purchase:view'), purchasesReportsController.returns);
router.get('/top-suppliers', requirePermission('purchase:view'), purchasesReportsController.topSuppliers);

// // ================= USER & AUDIT =================
router.get('/user/summary', requirePermission('report:view'), userReportsController.getUserSummary);
router.get('/user/detail', requirePermission('report:view'), userReportsController.getUserDetail);
router.get('/user/activity', requirePermission('report:view'), userReportsController.userActivity);
router.get('/user/login', requirePermission('report:view'), userReportsController.loginReport);

module.exports = router;
;
// // ================= RETURNS =================
// router.get('/returns/purchase', requirePermission('report:view'), returnReport.purchaseReturnReport);
// router.get('/returns/sales', requirePermission('report:view'), returnReport.salesReturnReport);
// router.get('/returns/reason-analysis', requirePermission('report:view'), returnReport.returnReasonAnalysis);

// // ================= FINANCIAL =================
// router.get('/financial/profit-loss', requirePermission('report:view'), financialReport.profitLoss);
// router.get('/financial/receivable', requirePermission('report:view'), financialReport.receivableReport);
// router.get('/financial/payable', requirePermission('report:view'), financialReport.payableReport);

// // ================= WAREHOUSE =================
// router.get('/warehouse/stock', requirePermission('report:view'), warehouseReport.stockPerWarehouse);

// // ================= TRANSFER =================
// router.get('/transfer', requirePermission('report:view'), transferReport.transferReport);

// // ================= ADJUSTMENT =================
// router.get('/adjustment', requirePermission('report:view'), adjustmentReport.adjustmentReport);

// // ================= CUSTOMER =================
// router.get('/customer', requirePermission('report:view'), customerReport.customerDetailed);
// router.get('/customer/top', requirePermission('report:view'), customerReport.topCustomers);

// // ================= SUPPLIER =================
// router.get('/supplier', requirePermission('report:view'), supplierReport.supplierDetailed);
// router.get('/supplier/top', requirePermission('report:view'), supplierReport.topSuppliers);
