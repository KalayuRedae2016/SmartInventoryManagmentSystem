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
      .post(requirePermission('role:create'),roleController.createRole)
      .get(requirePermission('role:view'),roleController.getRoles)
      .delete(requirePermission('role:delete'),roleController.deleteRoles)

router.route('/:roleId')
      .get(requirePermission('role:view'),roleController.getRole)
      .patch(requirePermission('role:update'),roleController.updateRole)
      .delete(requirePermission('role:delete'),roleController.deleteRole);

router.get('/:roleId/users', requirePermission('role:view'), roleController.getUsersByRole);// Get users assigned to a role
router.post('/:roleId/assign', requirePermission('role:update'), roleController.assignUsersToRole);

module.exports=router