import express from 'express';
import {
    listSessions,
    createSession,
    getSessionStatus,
    deleteSession,
    getAvailableServices,
    updateSessionServices,
    getSessionByService
} from '../controllers/whatsapp.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// Session CRUD
router.get('/whatsapp/sessions', listSessions);
router.post('/whatsapp/session', createSession);
router.get('/whatsapp/session/:sessionId/status', getSessionStatus);
router.delete('/whatsapp/session/:sessionId', deleteSession);

// Service assignment
router.get('/whatsapp/services/list', getAvailableServices);
router.patch('/whatsapp/session/:sessionId/services', updateSessionServices);
router.get('/whatsapp/service/:serviceKey', getSessionByService);

export default router;
