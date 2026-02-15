import express from 'express';
import prescriptionController from '../controllers/clinic/prescription.controller.js';
import { verifyToken as authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Save or update a prescription
router.post('/api/prescriptions', authenticateUser, prescriptionController.savePrescription);

// Get prescription by appointment ID
router.get('/api/prescriptions/appointment/:appointmentId', authenticateUser, prescriptionController.getPrescriptionByAppointment);

// Get patient history (all prescriptions for a user)
router.get('/api/prescriptions/patient/:userId', authenticateUser, prescriptionController.getPatientHistory);

export default router;
