import express from 'express';
import ServicesController from '../../controllers/pharmacy/services.controller.js';
import ServiceCategoryController from '../../controllers/pharmacy/serviceCategory.controller.js';

const router = express.Router();

// --- Services ---
router.get('/services', ServicesController.getAllServices);
router.get('/services/:id', ServicesController.getServiceById);
router.post('/services', ServicesController.createService);
router.patch('/services/:id', ServicesController.updateService);
router.delete('/services/:id', ServicesController.deleteService);

// --- Service Categories ---
router.get('/service-categories', ServiceCategoryController.getAllServiceCategories);
router.post('/service-categories', ServiceCategoryController.createServiceCategory);
router.patch('/service-categories/:id', ServiceCategoryController.updateServiceCategory);
router.delete('/service-categories/:id', ServiceCategoryController.deleteServiceCategory);

export default router;
