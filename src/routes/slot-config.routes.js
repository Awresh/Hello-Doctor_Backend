import express from 'express'
import slotConfigController from '../controllers/clinic/slot-config.controller.js'

const router = express.Router()

// Admin Routes for Slot Configuration

// Clinic Slots
router.put('/admin/slots/clinic', slotConfigController.updateClinicSlots)
router.get('/admin/slots/clinic', slotConfigController.getClinicSlots)

// Doctor Slots
router.put('/admin/slots/doctor/:doctorId', slotConfigController.updateDoctorSlots)
router.get('/admin/slots/doctor/:doctorId', slotConfigController.getDoctorSlots)

// Slot Overrides
router.post('/admin/slots/override', slotConfigController.createOverride)

// Public/Booking Routes
router.get('/public/slots/available', slotConfigController.getAvailableSlots)

export default router
