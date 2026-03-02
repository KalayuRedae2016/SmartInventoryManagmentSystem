const express=require("express")
const app = express();
const router=express.Router();
const { authenticationJwt, requirePermission } = require('../utils/authUtils');
const wharehouseController=require("../controllers/wharehouseController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


//Protect all routes after this middleware
router.use(authenticationJwt);

router.route('/')
      .post(requirePermission("warehouse:create"),wharehouseController.createWarehouse)
      .get(requirePermission("warehouse:view"),wharehouseController.getAllWarehouses)
    //   .delete(requirePermission("warehouse:create"),wharehouseController.deleteAllWarehouses)


// Summary report route first
router.route('/summary/report')
  .get(requirePermission("warehouse:view"), wharehouseController.getWarehouseSummaryReport);

// Toggle status route
router.route('/:warehouseId/toggle-status')
  .patch(requirePermission("warehouse:update"), wharehouseController.toggleWarehouseStatus);

// Dynamic warehouseId route last
router.route('/:warehouseId')
  .get(requirePermission("warehouse:view"), wharehouseController.getWarehouseById)
  .patch(requirePermission("warehouse:update"), wharehouseController.updateWarehouse)
  .delete(requirePermission("warehouse:delete"), wharehouseController.deleteWarehouseById);


module.exports=router

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Warehouse management APIs
 */

/**
 * @swagger
 * /warehouses:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Main Warehouse"
 *             code: "MAIN_WH"
 *             location: "Addis Ababa"
 *             managerName: "John Doe"
 *             phone: "+251911000000"
 *             email: "main@warehouse.com"
 *             isActive: true
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 */

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: Get all warehouses with optional search, pagination, and sorting
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, code]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of warehouses with pagination
 */

/**
 * @swagger
 * /warehouses/{warehouseId}:
 *   get:
 *     summary: Get a warehouse by ID
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse retrieved successfully
 *       404:
 *         description: Warehouse not found
 */

/**
 * @swagger
 * /warehouses/{warehouseId}:
 *   patch:
 *     summary: Update a warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Updated Warehouse Name"
 *             location: "New Location"
 *             managerName: "Jane Doe"
 *             phone: "+251922000000"
 *             email: "updated@warehouse.com"
 *             isActive: false
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       404:
 *         description: Warehouse not found
 */

/**
 * @swagger
 * /warehouses/{warehouseId}:
 *   delete:
 *     summary: Delete a warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Warehouse deleted successfully
 *       400:
 *         description: Cannot delete warehouse with existing stock
 *       404:
 *         description: Warehouse not found
 */

/**
 * @swagger
 * /warehouses/{warehouseId}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Warehouse status toggled successfully
 *       404:
 *         description: Warehouse not found
 */

/**
 * @swagger
 * /warehouses/summary/report:
 *   get:
 *     summary: Get summary report of all warehouses
 *     description: Returns total users, roles, stock items, and transactions for each warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouse summary report
 *         content:
 *           application/json:
 *             example:
 *               status: 1
 *               totalWarehouses: 3
 *               data:
 *                 - warehouseId: 1
 *                   name: "Main Warehouse"
 *                   code: "MAIN_WH"
 *                   location: "Addis Ababa"
 *                   managerName: "John Doe"
 *                   phone: "+251911000000"
 *                   email: "main@warehouse.com"
 *                   totalUsers: 5
 *                   totalRoles: 3
 *                   totalStockItems: 120
 *                   totalTransactions: 350
 *                   isActive: true
 *                 - warehouseId: 2
 *                   name: "Secondary Warehouse"
 *                   code: "SEC_WH"
 *                   location: "Bahir Dar"
 *                   managerName: "Jane Doe"
 *                   phone: "+251922000000"
 *                   email: "secondary@warehouse.com"
 *                   totalUsers: 2
 *                   totalRoles: 1
 *                   totalStockItems: 60
 *                   totalTransactions: 120
 *                   isActive: false
 */