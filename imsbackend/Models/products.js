'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'categoryId' });
      Product.belongsTo(models.Brand, { foreignKey: 'brandId' });
      Product.belongsTo(models.Unit, { foreignKey: 'unitId' });

      Product.hasMany(models.PurchaseItem, { foreignKey: 'productId' });
      Product.hasMany(models.SalesItem, { foreignKey: 'productId' });
      // You can add more relations if needed: ProductStock, StockTransaction
    }
  }

  Product.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, unique: true },
      tenantId:{type:DataTypes.INTEGER.UNSIGNED},
      name: { type: DataTypes.STRING, allowNull: false },//name of the product
      
      categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      brandId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      unitId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },//product unit

      defaultCostPrice: { type: DataTypes.FLOAT, defaultValue: 0 },//default product cost price
      defaultSellingPrice: { type: DataTypes.FLOAT, defaultValue: 0 },//default selling price

      purcahseUnitId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      salesUnitId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      orderTax: { type: DataTypes.FLOAT, defaultValue: 0 },//default tax percentage on sales orders
      taxType: { type: DataTypes.ENUM('inclusive', 'exclusive'), defaultValue: 'exclusive' },
      description: { type: DataTypes.TEXT },

      lastPurchaseCost: { type: DataTypes.FLOAT, defaultValue: 0 },
      minimumStock: { type: DataTypes.INTEGER, defaultValue: 0 },
      preferredCostMethod: { type: DataTypes.ENUM('FIFO', 'LIFO', 'AVERAGE'), defaultValue: 'AVERAGE' },

      barcode: { type: DataTypes.STRING },
      images: { type: DataTypes.JSON },// Array of image URLs
      
      sku: { type: DataTypes.STRING, unique: true },//stock keeping unit
      partNumber: { type: DataTypes.STRING },//manufacturer part number
      serialTracking: { type: DataTypes.BOOLEAN, defaultValue: false },//whether the product uses serial number tracking
      reorderLimit:{type:DataTypes.INTEGER,defaultValue:0},
      
      //check if th product has variants,serialNumbers,batches,not seeling directly
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      hasVariants: { type: DataTypes.BOOLEAN, defaultValue: false },

  
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'Products',
      timestamps: true,
    }
  );

  return Product;
};
