import express from 'express';
import { getTimeSettings, updateTimeSettings } from '../controllers/settings/time-settings.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/time-settings', verifyToken, getTimeSettings);
router.put('/time-settings', verifyToken, updateTimeSettings);

export default router;
