const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const unifiedTemplateController = require('../controllers/unifiedTemplateController');

router.use(verifyToken);
router.use(authorizeRoles('SUPER_ADMIN', 'ORGANISATION_ADMIN', 'DEPARTMENT_MANAGER', 'TEAM_LEADER', 'STAFF'));

router.get('/', unifiedTemplateController.listTemplates);
router.post('/', unifiedTemplateController.createTemplate);
router.get('/:id', unifiedTemplateController.getTemplate);
router.put('/:id', unifiedTemplateController.updateTemplate);
router.delete('/:id', unifiedTemplateController.deleteTemplate);

module.exports = router;
