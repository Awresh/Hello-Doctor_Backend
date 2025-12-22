import express from 'express'
import appointmentController from '../controllers/clinic/appointment.controller.js'
import { verifyToken as authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router()

// Create a new appointment
router.post('/', authenticateUser, appointmentController.createAppointment)

// Get all appointments (with filters)
router.get('/', authenticateUser, appointmentController.getAppointments)

// Get a single appointment by ID
router.get('/:id', authenticateUser, appointmentController.getAppointmentById)

// Update appointment status
router.patch('/:id/status', authenticateUser, appointmentController.updateAppointmentStatus)

export default router
