import express from 'express';
import * as controller from '../controllers/admin.controller.js';
import auth from '../middleware/auth.middleware.js';
import requireRole from '../middleware/rbac.middleware.js';
import validate from '../middleware/validate.middleware.js';
import schemas from '../schemas/admin.schema.js';

const router = express.Router();

// List clients who are not verified
router.get('/not-verified-client', auth, requireRole('ADMIN'), controller.getNotVerifiedClients);

// List lawyers who are not verified
router.get('/not-verified-lawyers', auth, requireRole('ADMIN'), controller.getNotVerifiedLawyers);

// Verify a lawyer (by userId or lawyer.id)
router.put('/:id/verifylawyer', auth, requireRole('ADMIN'), validate(schemas.idParamSchema), controller.verifyLawyer);

// Verify a client (by userId or client.id)
router.put('/:id/verifyclient', auth, requireRole('ADMIN'), validate(schemas.idParamSchema), controller.verifyClient);

export default router;

