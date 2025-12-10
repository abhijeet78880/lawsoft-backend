import { Request, Response } from 'express';
import caseService from '../services/case.service.js';
import storageService from '../services/storage.service.js';
import { ApiError } from '../middleware/error.middleware.js';
import { createCaseSchema, createTimelineEventSchema } from '../schemas/case.schema.js';
import { prisma } from '../utils/prisma/index.js';
import { createNotification } from '../services/notification.service.js';

export async function createCase(req: Request, res: Response) {
  try {
    const clientId = (req as any).user?.id as string;
    if (!clientId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, description, category } = req.body as any;
    const c = await caseService.createCase({ clientId, title, description, category});
    res.status(201).json({ case: c });
  } catch (err: any) {
    res.status(400).json({ error: String(err.message ?? err) });
  }
}

export async function listCases(req: Request, res: Response) {
  try {
    const uid = (req as any).user?.id as string;
    const role = (req as any).user?.role as string;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const items = await caseService.listForUser(uid, role);
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: String(err.message ?? err) });
  }
}

export async function getCase(req: Request, res: Response) {
  try {
    console.error(1234567890, "i am getting called")
    const id = req.params.id;
    const c = await caseService.getById(id);
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json({ case: c });
  } catch (err: any) {
    res.status(500).json({ error: String(err.message ?? err) });
  }
}

export async function updateCase(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const user = (req as any).user;
    const existing = await caseService.getById(id);
    if (!existing) return res.status(404).json({ error: 'Case not found' });

    // Access control: allow if admin, lawyer assigned, or client owner
    if (user.role !== 'ADMIN' && user.role !== 'LAWYER' && existing.clientId !== user.id) {
      throw new ApiError(403, 'Forbidden');
    }

    const updated = await caseService.updateCase(id, req.body);
    res.json({ case: updated });
  } catch (err: any) {
    if (err instanceof ApiError) return res.status(err.statusCode).json({ error: err.message });
    res.status(400).json({ error: String(err.message ?? err) });
  }
}

export async function addDocument(req: Request, res: Response) {
  try {
    const caseId = req.params.id;
    const uploaderId = (req as any).user?.id as string;
    if (!uploaderId) return res.status(401).json({ error: 'Unauthorized' });

    const { fileurl, fileName, mimeType, size } = req.body as any;

    // create document record pointing to the s3 url (assuming public PUT will succeed)
    const doc = await caseService.addDocument(caseId, uploaderId, { fileurl, fileName, mimeType, size });
    res.status(201).json({ document: doc });
  } catch (err: any) {
    res.status(400).json({ error: String(err.message ?? err) });
  }
}

export async function listDocuments(req: Request, res: Response) {
  try {
    const caseId = req.params.id;
    const docs = await caseService.listDocuments(caseId);
    res.json({ data: docs });
  } catch (err: any) {
    res.status(500).json({ error: String(err.message ?? err) });
  }
}

export async function addTimeline(req: Request, res: Response) {
  try {
    const caseId = req.params.id;
    const { title, description, eventDate, type } = req.body as any;
    const ev = await caseService.addTimelineEvent(caseId, { title, description, eventDate: new Date(eventDate), type });
    res.status(201).json({ event: ev });
  } catch (err: any) {
    res.status(400).json({ error: String(err.message ?? err) });
  }
}

export async function addHearing(req: Request, res: Response) {
  try {
    const caseId = req.params.id;
    const { date, court, judge, purpose, notes } = req.body as any;
    const hearing = await caseService.addHearing(caseId, { date: new Date(date), court, judge, purpose, notes });
    await prisma.caseTimeline.create({
      data: {
        caseId,
        title: `Hearing Scheduled on ${new Date(date).toDateString()}`,
        description: `A hearing has been scheduled at ${court} before Judge ${judge}. Purpose: ${purpose}`,
        eventDate: new Date(date),
        type: 'hearing'
      }
    })
    await createNotification(
      caseId, 
      'New Hearing Scheduled', 
      `A new hearing has been scheduled on ${new Date(date).toDateString()} at ${court}.`, 
      'CASE_UPDATE', 
      caseId
    );
    res.status(201).json({ hearing });
  } catch (err: any) {
    res.status(400).json({ error: String(err.message ?? err) });
  }
}

// zod schema for this controller is not defined in src/schemas/case.schema.ts please define it there later
export async function generatePresignedUpload(req: Request, res: Response) {
  try {
    const uploaderId = (req as any).user?.id as string;
    if (!uploaderId) return res.status(401).json({ error: 'Unauthorized' });

    const { fileName, mimeType, size } = req.params as any; // changed from req.body to req.params for testing

    // generate presigned URL for upload
    const key = `documents/${uploaderId}-${Date.now()}-${fileName}`;
    const presigned = await storageService.createPresignedUpload(key, mimeType);
    if (!presigned) return res.status(501).json({ error: 'Storage not configured' });
    res.status(201).json({ upload: presigned });
  } catch (err: any) {
    res.status(400).json({ error: String(err.message ?? err) });
  }
}

export default { createCase, listCases, getCase, updateCase, addDocument, listDocuments, addTimeline, addHearing, generatePresignedUpload };

export async function createCaseDetailsByLawyer(req: Request, res: Response) : Promise<Response> {
  try {
     const lawyerId = (req as any).user?.id as string;
    if (!lawyerId) return res.status(401).json({ error: 'Unauthorized' });
    const {body: {clientId, description, appointmentId, title, category}} = createCaseSchema.parse(req);
    const caseCreated = await prisma.case.create({
      data: {
        lawyerId,
        clientId,
        description,
        appointmentId,
        title,
        category
      }
    })
    return res.status(201).json({ data: caseCreated });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function acceptCase(req: Request, res: Response) : Promise<Response> {
  try {
    const appointmentId = req.params.id;
    const today = new Date();
    const acceptedCase = await prisma.case.update({
      where: { appointmentId },
      data: {
        isAccepted: true,
        startedAt: today,
      }
    })
    return res.status(200).json({ data: acceptedCase });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getAllCases(req: Request, res: Response): Promise<Response> {
  try {
    const uid = (req as any).user?.id as string;
    const role = (req as any).user?.role as string;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    let search = null;
    if (role === 'LAWYER') {
      search = { lawyerId: uid };
    } else if (role === 'CLIENT') {
      search = { clientId: uid };
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
    console.warn('User ID:', uid, 'Role:', role);
    const cases = await prisma.case.findMany({
      where: search,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        caseNumber: true,
        courtName: true,
        status: true,
        isAccepted: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        closedAt: true,
        disputeResolutionMethod: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          }
        },
        lawyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          }
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            durationMins: true,
            status: true,
            meetingLink: true,
            notes: true,
          }
        }
      }
    });
    console.warn('Retrieved cases:', cases);
    return res.status(200).json({ data: cases });
  } catch (error: any) {
    console.error('Error retrieving cases:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getCaseDetails(req: Request, res: Response): Promise<Response> {
  try {
    const id = req.params.caseid;
    const cases = await prisma.case.findMany({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        caseNumber: true,
        courtName: true,
        status: true,
        isAccepted: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        closedAt: true,
        disputeResolutionMethod: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          }
        },
        lawyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          }
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            durationMins: true,
            status: true,
            meetingLink: true,
            notes: true,
          }
        }
      }
    });
    console.warn('Retrieved cases:', cases);
    return res.status(200).json({ data: cases });
  } catch (error: any) {
    console.error('Error retrieving cases:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function createTimelineEvent(req: Request, res: Response) : Promise<Response> {
  try {
    const {title, description, eventDate, type} = createTimelineEventSchema.parse(req.body);
    const caseId = req.params.caseid;
    const timelineEnent = await prisma.caseTimeline.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        type,
        caseId
      }
    })
    return res.status(201).json({ data: timelineEnent });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getTimelineEvents(req: Request, res: Response): Promise<Response> {
  try {
    const caseId = req.params.caseid;
    const timelineEvents = await prisma.caseTimeline.findMany({
      where : { caseId },
      select: {
        title: true,
        description: true,
        eventDate: true,
        type: true,
        createdAt: true,
      }
    });
    return res.status(200).json({ data: timelineEvents });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getHearings(req: Request, res: Response): Promise<Response> {
  try {
    const caseId = req.params.caseid;
    const hearings = await prisma.hearing.findMany({
      where : { caseId }
    });
    return res.status(200).json({ data: hearings });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}