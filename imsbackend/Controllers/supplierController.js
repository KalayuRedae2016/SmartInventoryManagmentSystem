const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../Models');
const { Op, where } = require('sequelize');
const validator = require('validator');
const Role = db.Role;

const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
require('dotenv').config();
const { formatDate } = require("../utils/formatDate")

exports.createRole = catchAsync(async (req, res, next) => {
    const { name, description } = req.body;
    if (!name) {
        return next(new AppError('Role name is required', 400));
    }
    const exists = await Role.findOne({ where: { name } });
    if (exists) {
        return next(new AppError('Role name already exists', 409));
    }
    const role = await Role.create({
        name,
        description, 
    });
    res.status(201).json({
        status: 'success',
        data: role,
    });
});
