const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');

router.get('/', permissionController.getPermissions);

module.exports = router;

