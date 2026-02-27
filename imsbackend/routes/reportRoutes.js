'use strict';

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requirePermission } = require('../utils/authUtils');

// ----------------- Dashboard -----------------
router.get(
  '/dashboard',
  requirePermission('report:view'), // Only users with report:view can access
  reportController.dashboardData
);

// ----------------- User Reports -----------------
router.get(
  '/users',
  requirePermission('report:view'),
  reportController.getUserReport
);

// ----------------- Customer Reports -----------------
router.get(
  '/customers/best',
  requirePermission('report:view'),
  reportController.getBestCustomers
);

// ----------------- Supplier Reports -----------------
router.get(
  '/suppliers',
  requirePermission('report:view'),
  reportController.getSupplierReport
);

// ----------------- Purchase Reports -----------------
router.get(
  '/purchases',
  requirePermission('report:view'),
  reportController.getPurchaseReport
);

// ----------------- Sale Reports -----------------
router.get(
  '/sales',
  requirePermission('report:view'),
  reportController.getSaleReport
);

// ----------------- Stock Reports -----------------
router.get(
  '/stocks',
  requirePermission('report:view'),
  reportController.getStockReport
);

// ----------------- Profit & Loss Reports -----------------
router.get(
  '/profit-loss',
  requirePermission('report:view'),
  reportController.getProfitLossReport
);

// ----------------- Payments Reports -----------------
router.get(
  '/payments',
  requirePermission('report:view'),
  reportController.getPaymentsReport
);

module.exports = router;