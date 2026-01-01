// // models/auditLog.js
// 'use strict';
// module.exports = (sequelize, DataTypes) => {
//   const { Model } = require('sequelize');
//   class AuditLog extends Model {
//     static associate(models) {
//       AuditLog.belongsTo(models.User, { foreignKey: 'userId' });
//     }
//   }
//   AuditLog.init({
//     userId: DataTypes.INTEGER,
//     action: DataTypes.STRING,
//     description: DataTypes.TEXT
//   }, { sequelize, modelName: 'AuditLog', tableName: 'AuditLogs' });
//   return AuditLog;
// };
