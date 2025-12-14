import { z } from 'zod';

export const createCaseSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string(),
    category: z.string(),
    appointmentId: z.string(),
    clientId: z.string(),
  }),
});

export type CreateCasePayloadSchema = z.infer<typeof createCaseSchema>;

export const updateCaseSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
  }),
});

export const addDocumentSchema = z.object({
  body: z.object({
    fileurl: z.string().min(1),
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.coerce.number().optional(),
  }),
});

export type AddDocumentSchema = z.infer<typeof addDocumentSchema>;

export const addTimelineSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ title: z.string().min(1), description: z.string().optional(), eventDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }), type: z.string().optional() }),
});

export const addHearingSchema = z.object({
  body: z.object({ date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }), court: z.string().optional(), judge: z.string().optional(), purpose: z.string().optional(), notes: z.string().optional() }),
});

export type AddHearingSchema = z.infer<typeof addHearingSchema>;

export const createTimelineEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }),
  type: z.string(),
})

export type CreateTimelineEventSchema = z.infer<typeof createTimelineEventSchema>;

// Task schemas
export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    assignedToId: z.string().min(1, 'Assigned user ID is required'),
    dueDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }).optional(),
  }),
});

export type CreateTaskSchema = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  params: z.object({ taskId: z.string().min(1) }),
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']),
  }),
});

export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;

export const getTasksSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export type GetTasksSchema = z.infer<typeof getTasksSchema>;

// Resolution method schema
export const updateResolutionMethodSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    resolutionMethod: z.enum(['TRIAL', 'MEDIATION', 'ARBITRATION']),
  }),
});

export type UpdateResolutionMethodSchema = z.infer<typeof updateResolutionMethodSchema>;

export default { createCaseSchema, updateCaseSchema, addDocumentSchema, addTimelineSchema, addHearingSchema, createTimelineEventSchema, createTaskSchema, updateTaskSchema, getTasksSchema, updateResolutionMethodSchema };