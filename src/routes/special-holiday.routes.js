import express from 'express';
import { getSpecialHolidays, createSpecialHoliday, deleteSpecialHoliday } from '../controllers/settings/special-holiday.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/special-holidays', verifyToken, getSpecialHolidays);
router.post('/special-holidays', verifyToken, createSpecialHoliday);
router.delete('/special-holidays/:id', verifyToken, deleteSpecialHoliday);

export default router;
