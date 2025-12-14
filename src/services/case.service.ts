import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createCase(data: { clientId: string; title: string; description?: string; category?: string; courtName?: string }) {
  return prisma.case.create({ data: { clientId: data.clientId, title: data.title, description: data.description ?? '', category: data.category ?? '', courtName: data.courtName ?? '' } });
}

export async function listForUser(userId: string, role: string) {
  if (role === 'LAWYER') {
    return prisma.case.findMany({ where: { lawyerId: userId }, include: { documents: true, timeline: true, hearings: true } });
  }
  // default: client
  return prisma.case.findMany({ where: { clientId: userId }, include: { documents: true, timeline: true, hearings: true } });
}

export async function getById(id: string) {
  return prisma.case.findUnique({ where: { id }, include: { documents: true, timeline: true, hearings: true, chat: true } });
}

export async function updateCase(id: string, data: any) {
  return prisma.case.update({ where: { id }, data });
}

export async function addDocument(caseId: string, uploaderId: string, doc: { fileurl: string; fileName: string; mimeType: string; size?: number }) {
//   const url = configUrlForKey(doc.key);
  return prisma.document.create({ data: { caseId, uploaderId, filename: doc.fileName, url: doc.fileurl, mimeType: doc.mimeType, size: doc.size ?? 0 } });
}

// this is a helper fn move it to utils/helper.ts later
// function configUrlForKey(key: string) {
//   // If S3 configured, derive URL; otherwise return key as path
//   // This is a simple helper; in production you may want to store CDN URL or S3 domain in config
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const cfg = require('../config/index.js').config;
//   if (cfg.aws?.s3?.bucket && cfg.aws?.s3?.region) {
//     return `https://${cfg.aws.s3.bucket}.s3.${cfg.aws.s3.region}.amazonaws.com/${key}`;
//   }
//   return key;
// }

export async function listDocuments(caseId: string) {
  return prisma.document.findMany({ where: { caseId } });
}

export async function addTimelineEvent(caseId: string, data: { title: string; description?: string; eventDate: Date; type?: string }) {
  return prisma.caseTimeline.create({ data: { caseId, title: data.title, description: data.description, eventDate: data.eventDate, type: data.type ?? 'event' } });
}

export async function addHearing(caseId: string, data: { date: Date; court?: string; judge?: string; purpose?: string; notes?: string }) {
  return prisma.hearing.create({ data: { caseId, date: data.date, court: data.court ?? null, judge: data.judge ?? null, purpose: data.purpose ?? '', notes: data.notes ?? null } });
}

// Task functions
export async function createTask(caseId: string, assignedById: string, data: { title: string; description?: string; assignedToId: string; dueDate?: Date }) {
  return prisma.task.create({
    data: {
      caseId,
      title: data.title,
      description: data.description ?? null,
      assignedToId: data.assignedToId,
      assignedById,
      dueDate: data.dueDate ?? null,
      status: 'PENDING',
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
}

export async function updateTaskStatus(taskId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE') {
  return prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
}

export async function getTasksByCaseId(caseId: string) {
  return prisma.task.findMany({
    where: { caseId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      case: { select: { id: true, title: true, clientId: true, lawyerId: true } },
    },
  });
}

// Resolution method function
export async function updateResolutionMethod(caseId: string, resolutionMethod: 'TRIAL' | 'MEDIATION' | 'ARBITRATION') {
  return prisma.case.update({
    where: { id: caseId },
    data: { disputeResolutionMethod: resolutionMethod },
  });
}

export default { createCase, listForUser, getById, updateCase, addDocument, listDocuments, addTimelineEvent, addHearing, createTask, updateTaskStatus, getTasksByCaseId, getTaskById, updateResolutionMethod };
