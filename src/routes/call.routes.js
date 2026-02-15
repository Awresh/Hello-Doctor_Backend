import express from 'express';
import { getCallHistory } from '../controllers/call.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/history', verifyToken, getCallHistory);

export default router;
