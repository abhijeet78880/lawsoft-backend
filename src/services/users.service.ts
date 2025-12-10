import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();



export async function getById(id: string) {
	return prisma.user.findUnique({ where: { id } });
}

export async function updateById(id: string, data: Partial<{ name?: string; phone?: string; avatarUrl?: string }>) {
	return prisma.user.update({ where: { id }, data });
}

export async function getCurrent(userId: string) {
	return getById(userId);
}

 

// ----- Client & Lawyer profile helpers -----
export async function getClientInfoByUserId(userId: string) {
	// Prisma model is `Client` mapped to prisma.client
	return prisma.client.findUnique({ where: { userId } });
}

export async function upsertClientInfo(userId: string, payload: Record<string, any>) {
	// Use upsert so create or update is handled in one call
	return prisma.client.upsert({
		where: { userId },
		create: { userId, ...payload, dob: payload.dob ? new Date(payload.dob + "T00:00:00.000Z") : undefined },
		update: { ...payload, dob: payload.dob ? new Date(payload.dob + "T00:00:00.000Z") : undefined },
	});
}

export async function getLawyerInfoByUserId(userId: string) {
	// Prisma model is `Lawyer` mapped to prisma.lawyer
	return prisma.lawyer.findUnique({ where: { userId } });
}

export async function upsertLawyerInfo(userId: string, payload: any) {
	return prisma.lawyer.upsert({
		where: { userId },
		create: { userId, ...payload},
		update: payload,
	});
}

// extend default export
export default { getById, updateById, getCurrent, getClientInfoByUserId, upsertClientInfo, getLawyerInfoByUserId, upsertLawyerInfo };
