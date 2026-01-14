## Smart Grand Inventory & Business Management System (Backend)
AI-Powered Inventory Management System
Multi-tenant inventory, sales, purchase, and reporting system designed for
auditability, scalability, and clean stock control.

## System Architecture Overview

- **Multi-tenant** (each business is isolated by `tenant_id`)
- **Document-based operations** (Purchase, Sale, Transfer, Adjustment)
- **System-controlled stock** (no manual stock edits)
- **Append-only stock history**
- **Configurable costing** (FIFO, LIFO, Average, Moving Average)
- **Read-only reporting layer**

## Major Modules & Sub-Modules
## 1. Settings & Configuration Module
_System access and defaults_

### Sub-Modules
- Roles
- Permissions
- Role–Permission Mapping
- System Settings
  - Default warehouse
  - Default customer
  - Default language
- Account Status (Active / Inactive)

### Key Rules
- RBAC enforced at service layer
- Permissions are action-based (create, view, update, delete, report)

## 2. Business (Tenant) Module 
-Multi-tenant foundation
### Sub-Modules
- Tenant (Business / Company)
- Subscription
- Subscription Plans
- Subscription Payments
- Warehouse Management

### Key Rules
- All data belongs to exactly one tenant
- Warehouses are physical stock locations

## 3. Product Module
_Product master data_

### Sub-Modules
- Category
- Brand
- Unit (supports unit conversion)
- Product
- Product Images
- Product Label Printing
### Key Rules
- Products depend on Category, Brand, and Unit
- No stock is created at product creation
## 4. People Module
_All parties interacting with the system_
### Sub-Modules
- System Users
- User Role Assignment
- Customers
- Suppliers
- Customer Online Requests (Pending/Approved)
- Supplier Online Requests (Pending/Approved)
### Key Rules
- Users are for authentication/authorization
- Customers and Suppliers are business entities
## 5. Inventory Operations Module
_Business documents that change stock_
### Sub-Modules
- Purchases
- Purchase Items
- Purchase Returns
- Sales
- Sale Items
- Sales Returns
- Stock Transfers
- Stock Transfer Items
- Stock Adjustments
- Stock Adjustment Items

### Key Rules
- Every document = Header + Items
- Documents are immutable after completion
- No direct stock manipulation
## 6. Stock Module (System-Controlled)
_Physical inventory state and audit_

### Sub-Modules
- Stock Snapshot (Current Stock)
- Stock Transactions (History / Ledger)

### Key Rules
- No CRUD APIs
- StockSnapshot updated only by operations
- StockTransactions are append-only
- One record per (product + warehouse)

## 7. Accounting & Costing Module
_Financial logic_

### Sub-Modules
- Costing Engine
  - FIFO
  - LIFO
  - Average Cost
  - Moving Average Cost
- Payments
  - Sales Payments
  - Purchase Payments
  - Sales Return Payments
  - Purchase Return Payments
- Expenses (optional)

### Key Rules
- Cost is calculated from stock transactions
- Payments are separate from documents

## 8. Reports Module
_Read-only generated data_

### Sub-Modules
- User Reports
- Sales Reports
- Purchase Reports
- Inventory Reports
- Warehouse Reports
- Customer Reports
- Supplier Reports
- Profit & Loss Reports
- Payment Reports

### Key Rules
- No direct data modification
- Generated via queries or views
- Filtered by date, warehouse, and entity

## 9. Utility / Support Module (Optional)
_Cross-cutting features_

### Sub-Modules
- Import / Export (Excel, PDF, Print)
- Audit Logs
- Activity Logs
- Notifications
- File Uploads
- Barcode / QR Code Generator

## Core Design Principles

- **Tenant Isolation:** All tables include `tenant_id`
- **Stock Integrity:** Stock updated only through transactions
- **Auditability:** No delete/update on stock history
- **Scalability:** Item-level tables for all documents
- **Extensibility:** Ready for batches, serials, expiry dates

## High-Level Module Interaction

