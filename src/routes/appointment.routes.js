import express from 'express'
import appointmentController from '../controllers/clinic/appointment.controller.js'
import { verifyToken as authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router()

// Create a new appointment
router.post('/api/appointments', authenticateUser, appointmentController.createAppointment)

// Get all appointments (with filters)
router.get('/api/appointments', authenticateUser, appointmentController.getAppointments)

// Get available slots
router.get('/api/appointments/available-slots', authenticateUser, appointmentController.getAvailableSlots)

// Get a single appointment by ID
router.get('/api/appointments/:id', authenticateUser, appointmentController.getAppointmentById)

// Update appointment status
router.patch('/api/appointments/:id/status', authenticateUser, appointmentController.updateAppointmentStatus)

export default router
