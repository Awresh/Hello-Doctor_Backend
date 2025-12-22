import express from 'express'
import slotConfigController from '../controllers/clinic/slot-config.controller.js'
import { verifyToken as authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router()

// Admin Routes for Slot Configuration

// Clinic Slots
router.put('/admin/slots/clinic', authenticateUser, slotConfigController.updateClinicSlots)
router.get('/admin/slots/clinic', authenticateUser, slotConfigController.getClinicSlots)

// Doctor Slots
router.put('/admin/slots/doctor/:doctorId', authenticateUser, slotConfigController.updateDoctorSlots)
router.get('/admin/slots/doctor/:doctorId', authenticateUser, slotConfigController.getDoctorSlots)

// Slot Overrides
router.post('/admin/slots/override', authenticateUser, slotConfigController.createOverride)

// Public/Booking Routes
router.get('/public/slots/available', authenticateUser, slotConfigController.getAvailableSlots)

export default router
