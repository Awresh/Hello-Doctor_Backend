import express from 'express';
import cors from 'cors';
import requestLogger from './logger/request.logger.js';
import errorMiddleware from './middleware/error.middleware.js';
import { sanitizeInput } from './middleware/sanitize.middleware.js';
import businessRouter from './routes/business-type.route.js';
import 'dotenv/config';
import authRouter from './routes/auth.route.js';
import adminRouter from './routes/admin.route.js';
import menuRouter from './routes/menu.routes.js';
import inventoryRouter from './routes/inventory.routes.js';
import timeSlotRouter from './routes/timeslot.routes.js';
import slotConfigRouter from './routes/slot-config.routes.js';
import tenantUserRouter from './routes/tenant-user.route.js';
import timeSettingsRoutes from './routes/time-settings.routes.js';
import specialHolidayRoutes from './routes/special-holiday.routes.js';
import roleRouter from './routes/tenant/role.routes.js';
import tenantRouter from './routes/tenant.route.js';
import appointmentRouter from './routes/appointment.routes.js';
import notificationRouter from './routes/notification.routes.js';
import pharmacyServicesRouter from './routes/pharmacy/services.routes.js';
import billingRouter from './routes/tenant/billing.routes.js';
import planRouter from './routes/plan.routes.js';
import prescriptionRouter from './routes/prescription.routes.js';
import { verifyToken } from './middleware/auth.middleware.js';
const app = express();

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(sanitizeInput);
app.use(requestLogger);

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, '../uploads');

app.use('/uploads', express.static(uploadsPath, {
    dotfiles: 'deny',
    index: false
}));

app.use(authRouter);
app.use(adminRouter);
app.use(businessRouter);
app.use('/api/plans', planRouter);
app.use('/api/settings', timeSettingsRoutes);
app.use('/api/settings', specialHolidayRoutes);
import paymentRouter from './routes/payment.routes.js';
app.use('/api', paymentRouter);
app.use(verifyToken);
app.use(menuRouter);
app.use(inventoryRouter)
app.use(timeSlotRouter);
app.use(slotConfigRouter);
app.use(tenantUserRouter);
app.use(roleRouter);
app.use(tenantRouter);
app.use('/billing', billingRouter);
app.use('/pharmacy', pharmacyServicesRouter);

import paymentModeRouter from './routes/tenant/payment-mode.routes.js';
app.use(paymentModeRouter);


import uploadRouter from './routes/upload.routes.js';

app.use(uploadRouter);
app.use(appointmentRouter);
app.use(notificationRouter);
app.use(prescriptionRouter);
import callRouter from './routes/call.routes.js';
app.use('/api/calls', callRouter);
// app.use('/api', routes);
app.use(errorMiddleware);


export default app;