import { Router } from 'express';
import { getPreSignedUrl } from '../controllers/storage.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
const router = Router();

router.get('/presigned', getPreSignedUrl);

export default router;