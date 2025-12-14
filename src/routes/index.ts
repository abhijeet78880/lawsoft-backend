// Central router: mounts feature routers under /api/v1 when available.

import express from 'express';

const router = express.Router();

// Helper to safely import and mount a route module if it exists.
async function tryMount(path: string, specifier: string) {
  try {
    // Use .js extension at runtime for ESM resolution (tsx/node will resolve to TS files).
    const mod = await import(specifier);
    const r = (mod && (mod.default || mod)) as express.Router;
    if (r && typeof r === 'function') {
      router.use(path, r);
    }
  } catch (err) {
    // missing module is OK during scaffold — don't crash
    // eslint-disable-next-line no-console
    console.warn(`Route not mounted ${path}: ${specifier} — ${String((err as any)?.message ?? err)}`);
  }
}

// Attempt to mount all known route groups (order matters for some middleware)
await tryMount('/auth', './auth.routes.js');
await tryMount('/users', './users.routes.js');
await tryMount('/lawyers', './lawyers.routes.js');
await tryMount('/appointments', './appointments.routes.js');
await tryMount('/cases', './cases.routes.js');
await tryMount('/chat', './chat.routes.js');
await tryMount('/admin', './admin.routes.js');
await tryMount('/webhooks', './webhooks.routes.js');
await tryMount('/model', './model.routes.js');
await tryMount('/storage', './storage.routes.js');

// Optionally expose a simple index
router.get('/', (_req, res) => {
  res.json({ success: true, message: 'API v1', mounts: ['auth','users','lawyers','appointments','cases','chat','admin','webhooks','storage'] });
});

// Lightweight health endpoint under /api/v1/health so service checks work even when feature routers are mounted
router.get('/health', (_req, res) => {
  res.json({ success: true, uptime: process.uptime() });
});

export default router;