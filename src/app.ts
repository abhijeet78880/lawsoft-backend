// Express app: sets up middleware (helmet, cors, json parser, request id, pino logger), mounts routes, and error handlers.
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';

// dynamic import config to work with ESM runtime (tsx / node --loader)
const configModule = await import('./config/index.js');
const { config } = configModule as any;
import { randomUUID } from 'crypto';

const app = express();

// Security and parsing
app.use(helmet());
app.use(cors({ origin: config.cors.origin ?? true }));
app.use(express.json({ limit: '10mb' }));

// Request ID middleware — generate a stable request id if missing
app.use((req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers['x-request-id'];
  const rid = typeof header === 'string' && header.trim().length > 0 ? header : randomUUID();
  // store on header for downstream access
  req.headers['x-request-id'] = rid;
  // also expose on request object for convenience
  (req as any).id = rid;
  next();
});

// Pino HTTP logger
app.use((pinoHttp as any)({ level: config.logLevel }));

// Mount API routes if available (optional)
  try {
    // dynamic import keeps startup resilient when routes are not yet implemented
  // use concatenation to avoid TypeScript static path resolution checks
  const routesModule = await import('./routes' + '/index.js');
    const router = routesModule && (routesModule.default || routesModule);
  if (router) {
    // router is an Express middleware (Router) — mount it directly under /api/v1
    app.use('/api/v1', router);
  } else {
    app.get('/api/v1/health', (_req: Request, res: Response) => res.json({ success: true, uptime: process.uptime() }));
  }
} catch (err) {
  // routes not present yet — expose a minimal health endpoint
  app.get('/api/v1/health', (_req: Request, res: Response) => res.json({ success: true, uptime: process.uptime() }));
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'not_found', message: 'Route not found' } });
});

// Error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as any;
  const status = error?.status ?? 500;
  const message = error?.message ?? 'Internal Server Error';
  // don't leak stack in production
  if (config.nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  res.status(status).json({ success: false, error: { code: error?.code ?? 'server_error', message } });
});

export default app;
