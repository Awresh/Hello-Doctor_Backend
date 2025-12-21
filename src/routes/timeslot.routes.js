import express from 'express'
import timeSlotController from '../controllers/admin/timeslot.controller.js'

const router = express.Router()

// POST /admin/timeslots - Create a new time slot
router.post('/admin/timeslots', timeSlotController.createTimeSlot)

// GET /admin/timeslots - Get all time slots
router.get('/admin/timeslots', timeSlotController.getTimeSlots)

// PUT /admin/timeslots/:id - Update a time slot
router.put('/admin/timeslots/:id', timeSlotController.updateTimeSlot)

// DELETE /admin/timeslots/:id - Delete a time slot
router.delete('/admin/timeslots/:id', timeSlotController.deleteTimeSlot)

export default router
