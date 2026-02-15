import express from 'express'
import { API_ROUTES } from '../config/serverConfig.js'
import BusinessControllers from '../controllers/business/business.controllers.js'

const router = express.Router()

// GET / - Get all business types
router.get(API_ROUTES.BUSINESS_TYPES, BusinessControllers.getAllBusinessTypes)

// GET /:id - Get business type by ID
router.get(API_ROUTES.BUSINESS_TYPE_BY_ID, BusinessControllers.getBusinessTypeById)

// POST / - Create new business type
router.post(API_ROUTES.BUSINESS_TYPES, BusinessControllers.createBusinessType)

// PATCH /:id - Update business type
router.patch(API_ROUTES.BUSINESS_TYPE_BY_ID, BusinessControllers.updateBusinessType)

// DELETE /:id - Delete business type
router.delete(API_ROUTES.BUSINESS_TYPE_BY_ID, BusinessControllers.deleteBusinessType)

// PATCH /:id/disable - Disable business type
router.patch(API_ROUTES.BUSINESS_TYPE_DISABLE, BusinessControllers.disableBusinessType)

// PATCH /:id/enable - Enable business type
router.patch(API_ROUTES.BUSINESS_TYPE_ENABLE, BusinessControllers.enableBusinessType)

export default router