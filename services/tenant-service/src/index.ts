import express from 'express';
import { tenantRouter } from './routes/tenants';
import { adminRouter } from './routes/admin';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Routes
app.use('/tenants', tenantRouter);
app.use('/admin', adminRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'tenant-service' });
});

app.listen(PORT, () => {
  logger.info(`Tenant Service running on port ${PORT}`);
});

export default app;
