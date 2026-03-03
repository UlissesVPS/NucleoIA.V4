import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { moduleRouter, lessonRouter } from './routes/courses.routes';

const app = express();

// Trust Nginx proxy - necessario para capturar IP real via X-Forwarded-For
app.set("trust proxy", 1); // Trust only 1 proxy (Nginx)

// Middlewares
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(env.UPLOAD_PATH));

// Routes
app.use('/api', routes);
app.use('/api/modules', moduleRouter);
app.use('/api/lessons', lessonRouter);

// Error handler
app.use(errorMiddleware);

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

export default app;
