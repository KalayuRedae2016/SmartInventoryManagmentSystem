const express=require("express")
const app = express();
const router=express.Router()

const rolePermissionController = require('../controllers/rolePermissionController');
const { authenticationJwt, requirePermission } = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

router.use(authenticationJwt);

router.route('/')
  // .get(requirePermission('role:update'), rolePermissionController.getrolePermissions)

router.route('/:roleId')
  .get(requirePermission("role:view"),rolePermissionController.getRolePermissions)
  .post(requirePermission('role:update'), rolePermissionController.assignPermissionsToRole)
  .delete(requirePermission('role:update'), rolePermissionController.removePermissionFromRole);//Remove single or select permission from role

router.route('/:roleId/clear')
  .delete(requirePermission('role:update'), rolePermissionController.clearRolePermissions);//Remove all permission from role

module.exports = router;