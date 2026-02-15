import express from 'express'
import slotConfigController from '../controllers/clinic/slot-config.controller.js'
import { API_ROUTES } from '../config/serverConfig.js'

const router = express.Router()

// Admin Routes for Slot Configuration

// Clinic Slots
router.put(API_ROUTES.SLOT_CONFIG.CLINIC, slotConfigController.updateClinicSlots)
router.get(API_ROUTES.SLOT_CONFIG.CLINIC, slotConfigController.getClinicSlots)

// Doctor Slots
router.put(API_ROUTES.SLOT_CONFIG.DOCTOR, slotConfigController.updateDoctorSlots)
router.get(API_ROUTES.SLOT_CONFIG.DOCTOR, slotConfigController.getDoctorSlots)

// Slot Overrides
router.post(API_ROUTES.SLOT_CONFIG.OVERRIDE, slotConfigController.createOverride)
router.delete(API_ROUTES.SLOT_CONFIG.OVERRIDE, slotConfigController.deleteOverride)

// Public/Booking Routes
router.get(API_ROUTES.SLOT_CONFIG.AVAILABLE, slotConfigController.getAvailableSlots)

export default router
