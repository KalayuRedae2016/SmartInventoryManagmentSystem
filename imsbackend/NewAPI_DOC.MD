# 📦 Inventory Management System (IMS) API Documentation

**Local_Base URL:** `https://grandinventory.com/api/ims` 
**Remote_Base URL:** `https://grandinventory.com/api/ims`  
**Authentication:** Baerer (Bearer Token)  
**RBAC Middleware:** `requirePermission('module.action')`, `requirePermissionOrSelf('module.action')`  

**Common Query Params:** `?page=&limit=&sortBy=&order=&search=&status=active|inactive`  

# Success Response Format:
  return res.status(200.201).json({
      error: false,
      status: 1,
      message:"Success Message",
      result:data.length,
      data: datas,
    });  
# Error Response Format:**
return res.status(500,404,400,401).json({
      error: true,
      status:0,
      message:"Error Message"
      data: [],
    });
# Business (Tenant)
Model:
    id(INT),
    name(STRING),
    ownerName(STRING),
    phone(STRING),
    email(STRING),
    address(STRING),
    logo(STRING),
    subscriptionStatus(ENUM: trial | pending | active | expired),
    trialStart(DATETIME),
    trialEnd(DATETIME),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Endpoints:
    GET    /businesses
    POST   /businesses
    GET    /businesses/:id
    PUT    /businesses/:id
    DELETE /businesses/:id
    PATCH  /businesses/:id/status
    POST   /businesses/:id/activate
    POST   /businesses/:id/expire
    POST   /businesses/:id/disable
Permissions
    role:create
    role:view
    role:update
    role:delete
    role:manage-permissions


Model:
    id(INT),
    subscriptionId(INT),
    amount(DECIMAL),
    paymentMethod(STRING),
    paymentSlipUrl(STRING),
    status(ENUM: pending | approved | rejected),
    reviewedBy(INT),
    reviewedAt(DATETIME),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Endpoints:
    GET    /subscription-payments
    POST   /subscription-payments
    GET    /subscription-payments/:id
    PUT    /subscription-payments/:id
    DELETE /subscription-payments/:id
    PATCH  /subscription-payments/:id/status
    GET    /subscriptions/:subscriptionId/payments
# Role
Model:
    id(INT),
    businessId(INT),
    name(STRING),
    code(STRING),
    description(STRING),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)
Endpoints:
    GET    /roles
    POST   /roles
    DELETE /roles

    GET    /roles/:roleId
    PATCH  /roles/:roleId
    DELETE /roles/:roleId

    GET    /roles/:roleId/users
    POST   /roles/:roleId/assign
    PATCH  /roles/:roleId/status
# Permission
Model:
    id(INT),
    businessId(INT),
    name(STRING),
    key(STRING),
    module(STRING),
    description(STRING),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)
Endpoints:
    GET    /permissions
    POST   /permissions
    DELETE /permissions

    GET    /permissions/:permissionId
    PATCH  /permissions/:permissionId
    DELETE /permissions/:permissionId
# RolePermission**
Model:
    id(INT),
    roleId(INT),
    permissionId(INT),
    createdAt(DATETIME),
    updatedAt(DATETIME)
Endpoints:
    GET    /role-permissions
    POST   /role-permissions
    DELETE /role-permissions

    GET    /role-permissions/:id
    PATCH  /role-permissions/:id
    DELETE /role-permissions/:id
# UserPermission**
Model:
    id(INT),
    userId(INT),
    permissionId(INT),
    granted(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)
Endpoints:
    GET    /user-permissions
    POST   /user-permissions
    DELETE /user-permissions

    GET    /user-permissions/:id
    PATCH  /user-permissions/:id
    DELETE /user-permissions/:id

    GET    /users/:userId/permissions
    POST   /users/:userId/permissions/assign
    PATCH  /users/:userId/permissions/:permissionId


model
    id(INT),
    businessId(INT),
    name(STRING),
    key(STRING),
    module(STRING),
    description(STRING),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)
endpoints
    GET    /permissions
    POST   /permissions
    DELETE /permissions

    GET    /permissions/:permissionId
    PATCH  /permissions/:permissionId
    DELETE /permissions/:permissionId
# Warehouse
Model:
    id(INT),
    businessId(INT),
    name(STRING),
    code(STRING),
    location(STRING),
    managerName(STRING),
    phone(STRING),
    email(STRING),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Endpoints:
    GET    /warehouses
    POST   /warehouses
    GET    /warehouses/:id
    PUT    /warehouses/:id
    DELETE /warehouses/:id
    PATCH  /warehouses/:id/status
    GET    /businesses/:businessId/warehouses
# User
Model:
    id(INT),
    businessId(INT),
    roleId(INT),
    fullName(STRING),
    phoneNumber(STRING),
    email(STRING),
    password(STRING),
    profileImage(STRING),
    address(STRING),
    isActive(BOOLEAN),
    passwordResetOTP(STRING),
    passwordResetOTPExpires(DATETIME),
    changePassword(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Authentication Endpoints:
    POST   /auth/signup
    POST   /auth/login
    POST   /auth/forgetPassword
    POST   /auth/verifyOTP
    PATCH  /auth/resetPassword

    get    /auth/getMe
    PATCH  /auth/updateMe
    POST   /auth/updateMyPassword

user Endpoints:
    GET    /users
    DELETE /users

    GET    /users/:id
    PATCH  /users/:id
    DELETE /users/:id

    PATCH  /users/:id/status
    PATCH  /users/:id/resetPassword
    POST  /users/sendEmails

    POST   /users/import
    GET    /users/export/excel
    GET    /users/export/pdf
# Category
Model:
    id(INT),
    businessId(INT),
    name(STRING),
    description(TEXT),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Endpoints:
    GET    /categories
    POST   /categories
    GET    /categories/:id
    PUT    /categories/:id
    DELETE /categories/:id
    PATCH  /categories/:id/status

    GET    /businesses/:businessId/categories

    POST   /categories/import
    GET    /categories/export/excel
    GET    /categories/export/pdf
# Brand
Model:
    id(INT),
    businessId(INT),
    name(STRING),
    country(STRING),
    description(TEXT),
    image(STRING),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Endpoints:
    GET    /brands
    POST   /brands
    GET    /brands/:id
    PUT    /brands/:id
    DELETE /brands/:id
    PATCH  /brands/:id/status

    GET    /businesses/:businessId/brands

    POST   /brands/import
    GET    /brands/export/excel
    GET    /brands/export/pdf
# Unit
Model:
    id(INT),
    businessId(INT),
    name(STRING),
    symbol(STRING),
    baseUnit(STRING),
    operator(STRING),
    operationValue(STRING),
    description(TEXT),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Endpoints:
    GET    /units
    POST   /units
    GET    /units/:id
    PUT    /units/:id
    DELETE /units/:id
    PATCH  /units/:id/status

    GET    /businesses/:businessId/units

    POST   /units/import
    GET    /units/export/excel
    GET    /units/export/pdf
# Product
Model:
    id(INT),
    businessId(INT),
    name(STRING),
    sku(STRING),
    partNumber(STRING),
    serialTracking(BOOLEAN),
    categoryId(INT),
    brandId(INT),
    unitId(INT),
    defaultCostPrice(FLOAT),
    defaultSellingPrice(FLOAT),
    lastPurchaseCost(FLOAT),
    minimumStock(INT),
    preferredCostMethod(ENUM: FIFO | LIFO | AVERAGE),
    barcode(STRING),
    images(JSON),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    Product → Business (belongsTo)
    Product → Category (belongsTo)
    Product → Brand (belongsTo)
    Product → Unit (belongsTo)

Endpoints:
    GET    /products
    POST   /products
    GET    /products/:id
    PUT    /products/:id
    DELETE /products/:id
    PATCH  /products/:id/status

    GET    /businesses/:businessId/products
    GET    /categories/:categoryId/products
    GET    /brands/:brandId/products

    POST   /products/import
    GET    /products/export/excel
    GET    /products/export/pdf
# Supplier
Model:
    id(INT),
    businessId(INT),
    code(STRING),
    name(STRING),
    phone(STRING),
    email(STRING),
    country(STRING),
    city(STRING),
    address(STRING),
    taxNumber(STRING),
    totalPurchaseDue(FLOAT),
    totalPurchaseReturnDue(FLOAT),
    additionalInfo(STRING),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    Supplier → Business (belongsTo)
    Supplier → Purchase (hasMany)

Endpoints:
    GET    /suppliers
    POST   /suppliers
    GET    /suppliers/:id
    PUT    /suppliers/:id
    DELETE /suppliers/:id
    PATCH  /suppliers/:id/status
    POST   /suppliers/import
    GET    /suppliers/export/excel
    GET    /suppliers/export/pdf
# Customer
Model:
    id(INT),
    businessId(INT),
    code(STRING),
    name(STRING),
    phone(STRING),
    email(STRING),
    country(STRING),
    city(STRING),
    address(STRING),
    taxNumber(STRING),
    totalSaleDue(FLOAT),
    totalSalesReturnDue(FLOAT),
    additionalInfo(STRING),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    Customer → Business (belongsTo)
    Customer → Sale (hasMany)

Endpoints:
    GET    /customers
    POST   /customers
    GET    /customers/:id
    PUT    /customers/:id
    DELETE /customers/:id
    PATCH  /customers/:id/status
    POST   /customers/import
    GET    /customers/export/excel
    GET    /customers/export/pdf
# Purchase
Model:
    id(INT),
    businessId(INT),
    warehouseId(INT),
    supplierId(INT),
    totalAmount(FLOAT),
    paidAmount(FLOAT),
    dueAmount(FLOAT),
    paymentMethod(ENUM: 'cash','credit'),
    status(ENUM: 'pending','partial','paid'),
    note(STRING),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    Purchase → Supplier (belongsTo)
    Purchase → Warehouse (belongsTo)
    Purchase → Business (belongsTo)

Endpoints:
    GET    /purchases
    POST   /purchases
    GET    /purchases/:id
    PUT    /purchases/:id
    DELETE /purchases/:id
    PATCH  /purchases/:id/status
    POST   /purchases/import
    GET    /purchases/export/excel
    GET    /purchases/export/pdf
# PurchaseItem
Model:
    id(INT),
    purchaseId(INT),
    businessId(INT),
    warehouseId(INT),
    productId(INT),
    quantity(INT),
    unitPrice(FLOAT),
    total(FLOAT),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    PurchaseItem → Purchase (belongsTo)
    PurchaseItem → Product (belongsTo)

Endpoints:
    GET    /purchase-items
    POST   /purchase-items
    GET    /purchase-items/:id
    PUT    /purchase-items/:id
    DELETE /purchase-items/:id
    PATCH  /purchase-items/:id/status
    POST   /purchase-items/import
    GET    /purchase-items/export/excel
    GET    /purchase-items/export/pdf
# PurchaseReturn
Model:
    id(INT),
    purchaseId(INT),
    businessId(INT),
    warehouseId(INT),
    supplierId(INT),
    totalAmount(FLOAT),
    reason(STRING),
    status(ENUM('pending', 'completed')),
    isActive(BOOLEAN),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    PurchaseReturn → Purchase (belongsTo)
    PurchaseReturn → Supplier (belongsTo)
    PurchaseReturn → Warehouse (belongsTo)

Endpoints:
    GET    /purchase-returns
    POST   /purchase-returns
    GET    /purchase-returns/:id
    PUT    /purchase-returns/:id
    DELETE /purchase-returns/:id
    PATCH  /purchase-returns/:id/status
    POST   /purchase-returns/import
    GET    /purchase-returns/export/excel
    GET    /purchase-returns/export/pdf
# PurchaseReturnItem
Model:
    id(INT),
    purchaseReturnId(INT),
    businessId(INT),
    warehouseId(INT),
    productId(INT),
    quantity(INT),
    unitPrice(FLOAT),
    total(FLOAT),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    PurchaseReturnItem → PurchaseReturn (belongsTo)
    PurchaseReturnItem → Product (belongsTo)

Endpoints:
    GET    /purchase-return-items
    POST   /purchase-return-items
    GET    /purchase-return-items/:id
    PUT    /purchase-return-items/:id
    DELETE /purchase-return-items/:id
    PATCH  /purchase-return-items/:id/status
    POST   /purchase-return-items/import
    GET    /purchase-return-items/export/excel
    GET    /purchase-return-items/export/pdf
# Sale
Model:
    id(INT),
    businessId(INT),
    warehouseId(INT),
    customerId(INT),
    invoiceNumber(STRING),
    saleDate(DATETIME),
    totalAmount(DECIMAL),
    paidAmount(FLOAT),
    dueAmount(FLOAT),
    paymentMethod(ENUM: 'cash','bank_transfer','mobile_payment'),
    status(ENUM: 'pending','partial','paid'),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    Sale → SaleItem (hasMany)
    Sale → SaleReturn (hasMany)
    Sale → Customer (belongsTo)
    Sale → User (belongsTo)

Endpoints:
    GET    /sales
    POST   /sales
    GET    /sales/:id
    PUT    /sales/:id
    DELETE /sales/:id
    PATCH  /sales/:id/status
    POST   /sales/import
    GET    /sales/export/excel
    GET    /sales/export/pdf
# SaleItem
Model:
    saleId(INT),
    businessId(INT),
    warehouseId(INT),
    productId(INT),
    quantity(INT),
    unitPrice(FLOAT),
    total(FLOAT),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    SaleItem → Sale (belongsTo)
    SaleItem → Product (belongsTo)

Endpoints:
    GET    /sale-items
    POST   /sale-items
    GET    /sale-items/:id
    PUT    /sale-items/:id
    DELETE /sale-items/:id
    PATCH  /sale-items/:id/status
    POST   /sale-items/import
    GET    /sale-items/export/excel
    GET    /sale-items/export/pdf
# SaleReturn
Model:
    id(INT, PK),
    saleId(INT),
    businessId(INT),
    warehouseId(INT),
    customerId(INT),
    totalAmount(DECIMAL),
    status(BOOLEAN),
    paymentMethod(ENUM: 'cash','bank_transfer','mobile_payment'),
    returnDate(DATETIME),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    SaleReturn → Sale (belongsTo)
    SaleReturn → Customer (belongsTo)
    SaleReturn → SaleReturnItem (hasMany)

Endpoints:
    GET    /sale-returns
    POST   /sale-returns
    GET    /sale-returns/:id
    PUT    /sale-returns/:id
    DELETE /sale-returns/:id
    PATCH  /sale-returns/:id/status
    POST   /sale-returns/import
    GET    /sale-returns/export/excel
    GET    /sale-returns/export/pdf
# SaleReturnItem
Model:
    saleReturnId(INT),
    businessId(INT),
    warehouseId(INT),
    productId(INT),
    quantity(INT),
    unitPrice(FLOAT),
    total(FLOAT),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    SaleReturnItem → SaleReturn (belongsTo)
    SaleReturnItem → Product (belongsTo)

Endpoints:
    GET    /sale-return-items
    POST   /sale-return-items
    GET    /sale-return-items/:id
    PUT    /sale-return-items/:id
    DELETE /sale-return-items/:id
    POST   /sale-return-items/import
    GET    /sale-return-items/export/excel
    GET    /sale-return-items/export/pdf
# StockAdjustment
Model:
    id(INT),
    businessId(INT),
    warehouseId(INT),
    productId(INT),
    userId(INT),
    quantity(INT),
    adjustmentType(ENUM),
    note(STRING),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    StockAdjustment → Warehouse (belongsTo)
    SaleReturnItem → User (belongsTo)

Endpoints:
    GET    /sale-adjustment-
    POST   /sale-adjustment-
    GET    /sale-adjustment-/:id
    PUT    /sale-adjustment-/:id
    DELETE /sale-adjustment-/:id
    POST   /sale-adjustment-/import
    GET    /sale-adjustment-/export/excel
    GET    /sale-adjustment-/export/pdf
# StockTransfer
Model:
    id(INT, PK, autoIncrement),
    businessId(INT, not null),
    fromWarehouseId(INT, not null),
    toWarehouseId(INT, not null),
    productId(INT, not null),
    userId(INT, not null),
    quantity(INT, not null),
    note(STRING, nullable),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    StockTransfer → Product (belongsTo)
    StockTransfer → Warehouse (fromWarehouse, belongsTo)
    StockTransfer → Warehouse (toWarehouse, belongsTo)
    StockTransfer → User (belongsTo)

Endpoints:
    GET    /stock-transfers
    POST   /stock-transfers
    GET    /stock-transfers/:id
    PUT    /stock-transfers/:id
    DELETE /stock-transfers/:id
    POST   /stock-transfers/import
    GET    /stock-transfers/export/excel
    GET    /stock-transfers/export/pdf
# Stock
Model:
    id(INT, PK, autoIncrement),
    businessId(INT, not null),
    warehouseId(INT, not null),
    productId(INT, not null),
    quantity(INT, not null),
    type(ENUM: 'IN', 'OUT', 'TRANSFER', 'ADJUST', not null),
    referenceId(INT, nullable),
    performedBy(INT, nullable),
    note(STRING, nullable),
    valueDate(DATETIME, default NOW),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    Stock → Product (belongsTo)

Endpoints:
    GET    /stocks
    POST   /stocks
    GET    /stocks/:id
    PUT    /stocks/:id
    DELETE /stocks/:id
    PATCH  /stocks/:id/adjust
    POST   /stocks/import
    GET    /stocks/export/excel
    GET    /stocks/export/pdf
# StockTransaction
Model:
    id(INT, PK, autoIncrement),
    businessId(INT, not null),
    warehouseId(INT, not null),
    productId(INT, not null),
    type(ENUM: 'IN', 'OUT', 'TRANSFER', 'ADJUST', not null),
    quantity(INT, not null),
    referenceType(ENUM: 'PURCHASE','SALE','RETURN','ADJUSTMENT','TRANSFER', nullable),
    referenceId(INT, nullable),
    performedBy(INT, nullable),
    note(STRING, nullable),
    createdAt(DATETIME),
    updatedAt(DATETIME)

Relationships:
    StockTransaction → Business (belongsTo)
    StockTransaction → Warehouse (belongsTo)
    StockTransaction → Product (belongsTo)
    StockTransaction → User (belongsTo)

Endpoints:
    GET    /stock-transactions
    POST   /stock-transactions
    GET    /stock-transactions/:id
    PUT    /stock-transactions/:id
    DELETE /stock-transactions/:id
    POST   /stock-transactions/import
    GET    /stock-transactions/export/excel
    GET    /stock-transactions/export/pdf
# ALL POSSIBLE PERMISSIONS (BY MODULE)
    auth:login
    auth:logout
    auth:reset-password

    user:view
    user:create
    user:update
    user:delete
    user:activate
    user:deactivate
    user:reset-password

    business:view
    business:update
    business:settings

    product:view
    product:create
    product:update
    product:delete
    product:import
    product:export

    category:view
    category:create
    category:update
    category:delete

    stock:view
    stock:update
    stock:adjust
    stock:transfer

    purchase:view
    purchase:create
    purchase:update
    purchase:cancel
    purchase:approve

    sale:view
    sale:create
    sale:update
    sale:cancel
    sale:approve

    report:view
    report:export
    report:pdf
    report:excel




## Purchase Registration Flow (Required)
1. Create a `Purchase` first using `POST /purchases`.
   General/header fields belong here: `warehouseId`, `supplierId`, `invoiceNumber`, `totalAmount`, `paidAmount`, `paymentMethod`, `note`.
2. Then create one or many `PurchaseItem` rows using `POST /purchase-items` (or `POST /purchases/items`).
   Item/detail fields belong here: `productId`, `quantity`, `unitPrice`, `total` (amount per line).
3. Keep this sequence. Do not create purchase items before the parent purchase exists.

Stock meaning in this API:
- `Stock.quantity` = quantity on hand for one specific product (`productId`) in one specific warehouse (`warehouseId`) under one business (`businessId`).
- This is not a document total; it is per-product count.
