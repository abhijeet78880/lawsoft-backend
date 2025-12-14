import { NotificationType } from "@prisma/client";
import { prisma } from "../utils/prisma/index.js";

export async function createNotification(userId: string, title: string, body: string, type: NotificationType, data: string | undefined): Promise<boolean> {
    try {
        const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            body,
            type,
            data,
        }
    })
    return true;
    } catch (error) {
        return false;
    }
}