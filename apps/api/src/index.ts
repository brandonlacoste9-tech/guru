import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import automationRoutes from './routes/automationRoutes';
import chaosRoutes from './routes/chaosRoutes';
import { SocketService } from './services/socketService';

const app = express();
const port = process.env.PORT || 4000;
const httpServer = createServer(app);

// Initialize WebSockets
SocketService.init(httpServer);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/automation', automationRoutes);
app.use('/api/test', chaosRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'floguru-api'
  });
});

httpServer.listen(port, () => {
  console.log(`🚀 FloGuru API running on http://localhost:${port}`);
});
