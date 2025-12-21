import express from 'express';
import cors from 'cors';
import requestLogger from './logger/request.logger.js';
import errorMiddleware from './middleware/error.middleware.js';
import businessRouter from './routes/business-type.route.js';
import 'dotenv/config';
import authRouter from './routes/auth.route.js';
import adminRouter from './routes/admin.route.js';
import menuRouter from './routes/menu.routes.js';
import inventoryRouter from './routes/inventory.routes.js';
import timeSlotRouter from './routes/timeslot.routes.js';
import slotConfigRouter from './routes/slot-config.routes.js';
import tenantUserRouter from './routes/tenant-user.route.js';
import roleRouter from './routes/tenant/role.routes.js';
import tenantRouter from './routes/tenant.route.js';
import { verifyToken } from './middleware/auth.middleware.js';
const app = express();

app.use(cors({
    origin: "*"

}));
app.use(express.json({ limit: '50mb' })); // Increased limit for Base64 images

// Request logging middleware
app.use(requestLogger);

app.use(authRouter);
app.use(adminRouter);
app.use(businessRouter);
app.use(verifyToken);
app.use(menuRouter);
app.use(inventoryRouter)
app.use(timeSlotRouter);
app.use(slotConfigRouter);
app.use(tenantUserRouter);
app.use(roleRouter);
app.use(tenantRouter);
// app.use('/api', routes);
app.use(errorMiddleware);


export default app;