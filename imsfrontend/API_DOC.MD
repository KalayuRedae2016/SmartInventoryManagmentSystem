# **📦 Inventory Management System API Documentation**

# ## **📁 Category**

### **Model**

* id *(INT)*
* name *(STRING)*
* description *(STRING)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/categories
POST   /api/ims/categories
GET    /api/ims/categories/:id
PUT    /api/ims/categories/:id
DELETE /api/ims/categories/:id
```

# ## **📁 Brand**

### **Model**

* id *(INT)*
* name *(STRING)*
* description *(STRING)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/brands
POST   /api/ims/brands
GET    /api/ims/brands/:id
PUT    /api/ims/brands/:id
DELETE /api/ims/brands/:id
```

---

# ## **📁 Unit**

### **Model**

* id *(INT)*
* name *(STRING)*
* symbol *(STRING)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/units
POST   /api/ims/units
GET    /api/ims/units/:id
PUT    /api/ims/units/:id
DELETE /api/ims/units/:id
```

---

# ## **📦 Product**

### **Model**

* id *(INT)*
* productName *(STRING)*
* categoryId *(INT, FK)*
* brandId *(INT, FK)*
* unitId *(INT, FK)*
* sku *(STRING)*
* barcode *(STRING)*
* reorderLevel *(INT)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/products
POST   /api/ims/products
GET    /api/ims/products/:id
PUT    /api/ims/products/:id
DELETE /api/ims/products/:id
```

### **Queries**

```
GET /api/ims/products?search=oil&categoryId=1&brandId=2
```

---

# ## **📁 Supplier**

### **Model**

* id *(INT)*
* name *(STRING)*
* phone *(STRING)*
* email *(STRING)*
* address *(STRING)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/suppliers
POST   /api/ims/suppliers
GET    /api/ims/suppliers/:id
PUT    /api/ims/suppliers/:id
DELETE /api/ims/suppliers/:id
```

---

# ## **📁 Customer**

### **Model**

* id *(INT)*
* name *(STRING)*
* phone *(STRING)*
* email *(STRING)*
* address *(STRING)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/customers
POST   /api/ims/customers
GET    /api/ims/customers/:id
PUT    /api/ims/customers/:id
DELETE /api/ims/customers/:id
```

---

# ## **🛒 Purchase**

### **Model**

* id *(INT)*
* supplierId *(INT, FK)*
* invoiceNumber *(STRING)*
* purchaseDate *(DATE)*
* totalAmount *(DECIMAL)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/purchases
POST   /api/ims/purchases
GET    /api/ims/purchases/:id
PUT    /api/ims/purchases/:id
DELETE /api/ims/purchases/:id
```

---

# ## **🛒 Purchase Items**

### **Model**

* id *(INT)*
* purchaseId *(INT, FK)*
* productId *(INT, FK)*
* qty *(INT)*
* unitPrice *(DECIMAL)*
* totalPrice *(DECIMAL)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/purchase-items?purchaseId=1
POST   /api/ims/purchase-items
PUT    /api/ims/purchase-items/:id
DELETE /api/ims/purchase-items/:id
```

---

# ## **🧾 Sales**

### **Model**

* id *(INT)*
* customerId *(INT, FK)*
* invoiceNumber *(STRING)*
* salesDate *(DATE)*
* totalAmount *(DECIMAL)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/sales
POST   /api/ims/sales
GET    /api/ims/sales/:id
PUT    /api/ims/sales/:id
DELETE /api/ims/sales/:id
```

---

# ## **🧾 Sales Items**

### **Model**

* id *(INT)*
* salesId *(INT, FK)*
* productId *(INT, FK)*
* qty *(INT)*
* unitPrice *(DECIMAL)*
* totalPrice *(DECIMAL)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/sales-items?salesId=1
POST   /api/ims/sales-items
PUT    /api/ims/sales-items/:id
DELETE /api/ims/sales-items/:id
```

---

# ## **📉 Sales Adjustment**

### **Model**

* id *(INT)*
* salesId *(INT, FK)*
* adjustmentType *(ENUM: discount | refund | correction)*
* amount *(DECIMAL)*
* note *(STRING)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Endpoints**

```
GET    /api/ims/sales-adjustments
POST   /api/ims/sales-adjustments
GET    /api/ims/sales-adjustments/:id
PUT    /api/ims/sales-adjustments/:id
DELETE /api/ims/sales-adjustments/:id
```

---

# ## **📦 Stock Transactions**

### **Model**

* id *(INT)*
* productId *(INT, FK)*
* transactionType *(ENUM: IN | OUT)*
* referenceType *(ENUM: purchase | sale | adjustment)*
* referenceId *(INT)*
* qty *(INT)*
* createdAt *(DATETIME)*

### **Endpoints**

```
GET /api/ims/stock-transactions
GET /api/ims/stock-transactions?productId=1
```

---

# ## **📦 Stock Movement**

### **Model**

* id *(INT)*
* productId *(INT, FK)*
* previousStock *(INT)*
* newStock *(INT)*
* difference *(INT)*
* reason *(STRING)*
* createdAt *(DATETIME)*

### **Endpoints**

```
GET /api/ims/stock-movements
GET /api/ims/stock-movements?productId=1
```

---

# ## **👤 Users**

### **Model**

* id *(INT)*
* name *(STRING)*
* email *(STRING)*
* password *(STRING)*
* role *(ENUM: admin | employee)*
* createdAt *(DATETIME)*
* updatedAt *(DATETIME)*

### **Auth Endpoints**

```
POST /api/ims/auth/register
POST /api/ims/auth/login
GET  /api/ims/auth/me
```
