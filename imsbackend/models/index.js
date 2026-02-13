'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

const db = {};

// Create Sequelize instance using environment variables
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  //logging: env === 'development', // Enable SQL logging in development
  //logging: console.log,
});

// Load all models dynamically
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {

    //console.log("📌 Loading model file:", file);

    const imported = require(path.join(__dirname, file));

    // Check if file exports a function
    if (typeof imported !== "function") {
      console.error("❌ ERROR: Model file does NOT export a function:", file);
      throw new Error("Invalid model file: " + file);
    }

    // Initialize model
    const model = imported(sequelize, Sequelize.DataTypes);
    db[model.name] = model;

    //console.log("✅ Loaded model:", model.name);
  });

// Setup associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    //console.log("🔗 Setting associations for:", modelName);
    db[modelName].associate(db);
  }
});

// Export connection and Sequelize
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
