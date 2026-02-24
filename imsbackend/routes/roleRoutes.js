const express=require("express")
const app = express();
const router=express.Router()

const roleController = require('../controllers/roleController');
const { authenticationJwt, requirePermission } = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

// Only admin users can manage permissions
router.use(authenticationJwt);
// router.use(requirePermission('role:manage'));

router.route('/')
      .post(requirePermission(['role:create', 'roles.create']), roleController.createRole)
      .get(requirePermission(['role:view', 'roles.view']), roleController.getAllRoles)
      .delete(requirePermission(['role:delete', 'roles.delete']), roleController.deleteRoles)

router.route('/:roleId')
      .get(requirePermission(['role:view', 'roles.view']), roleController.getRoleById)
      .patch(requirePermission(['role:update', 'roles.update']), roleController.updateRole)
      .delete(requirePermission(['role:delete', 'roles.delete']), roleController.deleteRole);
router.route('/:roleId/status')
      .patch(requirePermission(['role:update', 'roles.update']), roleController.changeRoleStatus);
// Get users assigned to a role

module.exports=router

