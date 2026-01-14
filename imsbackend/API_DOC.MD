# 📦 Inventory Management System (IMS) API Documentation

**Base URL:** `/api/ims`  
**Authentication:** JWT (Bearer Token)  
**RBAC Middleware:** `requirePermission('module.action')`, `requirePermissionOrSelf('module.action')`  

**Common Query Params:** `?page=&limit=&sortBy=&order=&search=&status=active|inactive`  



# Success Response Format:
  return res.status(200).json({
      error: false,
      status: 1,
      message:"Success Message",
      result:items.length,
      items: items,
    });
    
# Error Response Format:**
return res.status(500,404,400,401).json({
      error: true,
      message:"Error Message"
      items: [],
    });

# Category
Model: id(INT), name(STRING), description(STRING), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /categories
    POST   /categories
    GET    /categories/:id
    PUT    /categories/:id
    DELETE /categories/:id
    POST   /categories/import
    GET    /categories/export/excel
    GET    /categories/export/pdf
    PATCH  /categories/:id/status
# Brand
Model: id(INT), name(STRING), country(STRING), description(STRING), image(STRING), isActive(BOOLEAN), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /brands
    POST   /brands
    GET    /brands/:id
    PUT    /brands/:id
    DELETE /brands/:id
    POST   /brands/import
    GET    /brands/export/excel
    GET    /brands/export/pdf
    PATCH  /brands/:id/status
# Unit
Model: id(INT), name(STRING), symbol(STRING), baseUnit(STRING), operator(STRING), operationValue(DECIMAL), description(STRING), isActive(BOOLEAN), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /units
    POST   /units
    GET    /units/:id
    PUT    /units/:id
    DELETE /units/:id
    POST   /units/import
    GET    /units/export/excel
    GET    /units/export/pdf
    PATCH  /units/:id/status
# Product
Model: id(INT), name(STRING), categoryId(INT), brandId(INT), unitId(INT), costPrice(DECIMAL), sellingPrice(DECIMAL), reorderLimit(INT), hasVariants(BOOLEAN), hasSerialNumbers(BOOLEAN), hasBatches(BOOLEAN), SKU(STRING), barcode(STRING), description(STRING), isActive(BOOLEAN), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /products
    POST   /products
    GET    /products/:id
    PUT    /products/:id
    DELETE /products/:id
    PATCH  /products/:id/status
    POST   /products/labels/print
    POST   /products/import
    GET    /products/export/excel
    GET    /products/export/pdf
# Warehouse
Model: id(INT), name(STRING), code(STRING), location(STRING), managerName(STRING), contactPhone(STRING), isActive(BOOLEAN), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /warehouses
    POST   /warehouses
    GET    /warehouses/:id
    PUT    /warehouses/:id
    DELETE /warehouses/:id
    PATCH  /warehouses/:id/status
    POST   /warehouses/import
    GET    /warehouses/export/excel
    GET    /warehouses/export/pdf
# User
Model: id(INT), code(STRING), fullName(STRING), phone(STRING), email(STRING), password(STRING), roleId(INT), permissions(JSON/ARRAY), isActive(BOOLEAN), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /users
    POST   /users
    GET    /users/:id
    PUT    /users/:id
    DELETE /users/:id
    PATCH  /users/:id/status
    POST   /users/import
    GET    /users/export/excel
    GET    /users/export/pdf
# Customer
Model: id(INT), code(STRING), name(STRING), phone(STRING), email(STRING), country(STRING), city(STRING), address(STRING), taxNumber(STRING), totalSaleDue(DECIMAL), totalSaleReturnDue(DECIMAL), additionalInfo(STRING), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /customers
    POST   /customers
    GET    /customers/:id
    PUT    /customers/:id
    DELETE /customers/:id
    POST   /customers/import
    GET    /customers/export/excel
    GET    /customers/export/pdf
    PATCH  /customers/:id/status
# Supplier
Model: id(INT), code(STRING), name(STRING), phone(STRING), email(STRING), country(STRING), city(STRING), address(STRING), taxNumber(STRING), totalPurchaseDue(DECIMAL), totalPurchaseReturnDue(DECIMAL), additionalInfo(STRING), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /suppliers
    POST   /suppliers
    GET    /suppliers/:id
    PUT    /suppliers/:id
    DELETE /suppliers/:id
    POST   /suppliers/import
    GET    /suppliers/export/excel
    GET    /suppliers/export/pdf
    PATCH  /suppliers/:id/status
# Purchase
Model: id(INT), supplierId(INT), warehouseId(INT), totalAmount(DECIMAL), paidAmount(DECIMAL), status(STRING), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /purchases
    POST   /purchases
    GET    /purchases/:id
    POST   /purchases/:id/return
    POST   /purchases/import
    GET    /purchases/export/excel
    GET    /purchases/export/pdf
# Sale
Model: id(INT), customerId(INT), warehouseId(INT), totalAmount(DECIMAL), paidAmount(DECIMAL), status(STRING), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
    GET    /sales
    POST   /sales
    GET    /sales/:id
    POST   /sales/:id/return
    POST   /sales/import
    GET    /sales/export/excel
    GET    /sales/export/pdf
# Stock
Model: id(INT), productId(INT), warehouseId(INT), quantity(DECIMAL), alertQuantity(DECIMAL), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
GET    /stock
GET    /stock/:productId
# Stock Transaction
Model: id(INT), productId(INT), warehouseId(INT), type(ENUM: IN, OUT, TRANSFER, ADJUSTMENT), quantity(DECIMAL), referenceType(STRING), referenceId(INT), performedBy(INT), remarks(STRING), valueDate(DATE), createdAt(DATETIME), updatedAt(DATETIME)
Endpoints:
GET    /stock-transactions
POST   /stock-transactions
# Stock Transfer
Endpoints:
GET    /stock-transfers
POST   /stock-transfers
# Stock Adjustment
Endpoints:
GET    /stock-adjustments
POST   /stock-adjustments
# Reports
Endpoints:
    GET /reports/stock
    GET /reports/stock-alerts
    GET /reports/product
    GET /reports/sales
    GET /reports/sales-products
    GET /reports/best-customers
    GET /reports/purchases
    GET /reports/purchase-products
    GET /reports/suppliers
    GET /reports/profit-loss
# Bulk & Export Operations
POST /{module}/import
GET  /{module}/export/excel
GET  /{module}/export/pdf