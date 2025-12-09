import express from 'express';
import * as ctrl from '../controllers/cases.controller.js';
import auth from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import schemas from '../schemas/case.schema.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = express.Router();

router.post('/', auth, requireRole('CLIENT'), validate(schemas.createCaseSchema), ctrl.createCase);
router.get('/', auth, ctrl.listCases);
router.get('/:id', auth, ctrl.getCase);
router.put('/:id', auth, validate(schemas.updateCaseSchema), ctrl.updateCase);

// this is a universal route to generate presigned upload urls for uploading documents
router.get('/:id/getpresignedUrl', auth, ctrl.generatePresignedUpload);

router.post('/:id/saveDocuments', auth, validate(schemas.addDocumentSchema), ctrl.addDocument);
router.get('/:id/documents', auth, ctrl.listDocuments);

router.post('/:id/timeline', auth, validate(schemas.addTimelineSchema), ctrl.addTimeline);
router.post('/:id/hearings', auth, requireRole('LAWYER'), validate(schemas.addHearingSchema), ctrl.addHearing);

router.post('/create/case/details/lawyer', auth, requireRole('LAWYER'), validate(schemas.createCaseSchema), ctrl.createCaseDetailsByLawyer);
router.post('/accept/case/:id', auth, requireRole('CLIENT'), ctrl.acceptCase);
router.get('/getall/cases', auth, requireRole('CLIENT', 'LAWYER'), ctrl.getAllCases);
router.get('/get/details/:caseid', auth, requireRole('CLIENT', 'LAWYER'), ctrl.getCaseDetails);
router.post('/add/timeline/event/:caseid', auth, requireRole('LAWYER'), validate(schemas.createTimelineEventSchema), ctrl.createTimelineEvent);

export default router;
