const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const quotationTemplateController = require('../controllers/quotationTemplateController');

router.use(verifyToken);
router.use(authorizeRoles('SUPER_ADMIN', 'ORGANISATION_ADMIN', 'DEPARTMENT_MANAGER', 'TEAM_LEADER', 'STAFF'));

router.get('/', quotationTemplateController.listTemplates);
router.post('/', quotationTemplateController.createTemplate);
router.get('/:id', quotationTemplateController.getTemplate);
router.put('/:id', quotationTemplateController.updateTemplate);
router.delete('/:id', quotationTemplateController.deleteTemplate);

module.exports = router;
