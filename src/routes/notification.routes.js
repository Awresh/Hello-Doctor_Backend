import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification/notification.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/api/notifications', verifyToken, getNotifications);
router.put('/api/notifications/:id/read', verifyToken, markAsRead);
router.put('/api/notifications/read-all', verifyToken, markAllAsRead);

export default router;
