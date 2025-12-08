import express from 'express';
import * as controll from '../controllers/appointments.controller.js';
import auth from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import schemas from '../schemas/appointment.schema.js';
import requireRole from '../middleware/rbac.middleware.js';

const router = express.Router();

router.post('/book', auth, validate(schemas.bookAppointmentSchema), requireRole('CLIENT'), controll.book);
router.post('/:id/cancel', auth, validate(schemas.cancelAppointmentSchema), requireRole('CLIENT','LAWYER'), controll.cancel);
router.post('/:id/attend', auth, validate(schemas.cancelAppointmentSchema), requireRole('CLIENT','LAWYER'), controll.attend);
router.get('/', auth, controll.list);
router.post('/:id/confirm-payment', auth, validate(schemas.confirmPaymentSchema), controll.confirmPayment);
// The availability endpoint is used by browsers which send a JSON body.
// Browsers typically don't send a body with GET requests, so allow POST as well.
router.get('/availability', auth, validate(schemas.availabilitySchema), controll.availability);
router.post('/availability', auth, validate(schemas.availabilitySchema), controll.availability);
router.post('/update-agreement-url', auth, validate(schemas.updateAgreementUrlSchema), requireRole('LAWYER'), controll.updateAgreementUrl);

// Public webhook endpoint
router.post('/webhook', controll.webhook);

export default router;
