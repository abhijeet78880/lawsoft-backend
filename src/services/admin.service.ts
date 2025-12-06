import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Return all client profiles where isVerified === false, include user info.
 */
export async function getNotVerifiedClients() {
  return prisma.client.findMany({ where: { isVerified: false }, include: { user: true } });
}

/**
 * Return all lawyer profiles where isVerified === false, include user info.
 */
export async function getNotVerifiedLawyers() {
  return prisma.lawyer.findMany({ where: { isVerified: false }, include: { user: true } });
}

/**
 * Mark a client as verified. Accepts either client.userId or client.id as identifier.
 */
export async function verifyClient(identifier: string) {
  // try to find by userId then by client id
  let client = await prisma.client.findUnique({ where: { userId: identifier } }).catch(() => null as any);
  if (!client) client = await prisma.client.findUnique({ where: { id: identifier } }).catch(() => null as any);
  if (!client) throw new Error('Client not found');

  const clientId = client.id;
  const userId = client.userId;

  await prisma.$transaction([
    prisma.client.update({ where: { id: clientId }, data: { isVerified: true } }),
    prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
  ]);

  return prisma.client.findUnique({ where: { id: clientId }, include: { user: true } });
}

/**
 * Mark a lawyer as verified. Accepts either lawyer.userId or lawyer.id as identifier.
 */
export async function verifyLawyer(identifier: string) {
  let lawyer = await prisma.lawyer.findUnique({ where: { userId: identifier } }).catch(() => null as any);
  if (!lawyer) lawyer = await prisma.lawyer.findUnique({ where: { id: identifier } }).catch(() => null as any);
  if (!lawyer) throw new Error('Lawyer not found');

  const lawyerId = lawyer.id;
  const userId = lawyer.userId;

  await prisma.$transaction([
    prisma.lawyer.update({ where: { id: lawyerId }, data: { isVerified: true } }),
    prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
  ]);

  return prisma.lawyer.findUnique({ where: { id: lawyerId }, include: { user: true } });
}

export default { getNotVerifiedClients, getNotVerifiedLawyers, verifyClient, verifyLawyer };
