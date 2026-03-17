
# 1️⃣ Sales Reports
These reports come from **Sale, SaleItem, SaleReturn**.
1. **Sales Summary Report** 
   * total sales, total paid, total due, total invoices
2. **Sales by Date**
   * daily,weekly,monthly,yearly
3. **Sales by Customer**
   * customer name,total purchase,total paid, total due
4. **Sales by Product**
   * product,quantity sold,revenue
5. **Sales by Warehouse**
   * warehouse, sales value
6. **Sales by User**
   * which employee sold most
7. **Top Selling Products**
8. **Sales Return Report**
9. **Invoice Report**
10. **Payment Method Report**
* cash,bank transfer,mobile payment

---

# 2️⃣ Purchase Reports
From **Purchase + PurchaseItem + PurchaseReturn**
1. **Purchase Summary**
2. **Purchases by Supplier**
3. **Purchases by Product**
4. **Purchases by Warehouse**
5. **Supplier Due Report**
6. **Purchase Return Report**
7. **Purchase Payment Report**
8. **Purchase Trend Report**

# 3️⃣ Stock Reports
From **Stock + StockTransfer + StockAdjustment**
1. **Current Stock Report**
   * product. warehouse, quantity
2. **Low Stock Report**
   * below minimum stock
3. **Out of Stock Report**
4. **Stock Movement Report**
   * IN, OUT, ADJUST,TRANSFER
5. **Stock Adjustment Report**
6. **Stock Transfer Report**
7. **Inventory Valuation Report**
   * FIFO,LIFO,Average

# 4️⃣ Product Reports
From **Product + Category + Brand**
1. Products by Category,Brand,Unit
2. Inactive Products
3. Product Price List
4. Product Profit Margin

# 5️⃣ Customer Reports
From **Customer + Sale**
1. Customer Purchase History
2. Customer Due Report
3. Top Customers
4. Customer Return Report

# 6️⃣ Supplier Reports
From **Supplier + Purchase**
1. Supplier Purchase History
2. Supplier Payment Report
3. Supplier Due Report
4. Supplier Return Report

# 7️⃣ Financial Reports
From **Sales + Purchases**
1. **Profit & Loss**
   * total sales
   * total purchase
   * profit
2. **Revenue Report**
3. **Expense Report**
4. **Payment Collection Report**

# 8️⃣ Warehouse Reports
From **Warehouse + Stock**

1. Stock by Warehouse
2. Warehouse Stock Value
3. Warehouse Transfer Report

---


1.
Optional filters:

```
GET /reports/sales-summary?startDate=2026-01-01&endDate=2026-01-30
GET /reports/current-stock?warehouseId=1
GET /reports/sales-by-product?productId=3
```
