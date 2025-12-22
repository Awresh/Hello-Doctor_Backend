import express from 'express'
import appointmentController from '../controllers/clinic/appointment.controller.js'

const router = express.Router()

// Create a new appointment
router.post('/', appointmentController.createAppointment)

// Get all appointments (with filters)
router.get('/', appointmentController.getAppointments)

// Get a single appointment by ID
router.get('/:id', appointmentController.getAppointmentById)

// Update appointment status
router.patch('/:id/status', appointmentController.updateAppointmentStatus)

export default router
