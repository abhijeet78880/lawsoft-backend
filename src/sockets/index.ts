import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import socketAuthMiddleware, { canJoinChat } from '../middleware/socket-auth.middleware.js';
import chatService from '../services/chat.service.js';

let io: Server | null = null;

// Track online users: userId -> Set of socket ids
const onlineUsers = new Map<string, Set<string>>();

export function getIO() {
	return io;
}

export function isUserOnline(userId: string): boolean {
	const sockets = onlineUsers.get(userId);
	return sockets ? sockets.size > 0 : false;
}

export function getOnlineUsers(): string[] {
	return Array.from(onlineUsers.keys()).filter((userId) => {
		const sockets = onlineUsers.get(userId);
		return sockets && sockets.size > 0;
	});
}

export function init(server: HttpServer, opts?: { logger?: any }) {
	io = new Server(server, { cors: { origin: '*' } });

	// Use middleware to authenticate socket
	io.use((socket, next) => socketAuthMiddleware(socket as Socket, next as any));

	io.on('connection', (socket: Socket) => {
		const user = (socket as any).user;
		const userId = user?.id;

		// Track user online status
		if (userId) {
			if (!onlineUsers.has(userId)) {
				onlineUsers.set(userId, new Set());
			}
			onlineUsers.get(userId)!.add(socket.id);

			// Broadcast user online to all connected clients
			socket.broadcast.emit('user:online', { userId });

			// Send current online users to the connecting client
			socket.emit('users:online', { usersOnline: getOnlineUsers() });
		}

		// Handle disconnect - update online status
		socket.on('disconnect', () => {
			if (userId) {
				const userSockets = onlineUsers.get(userId);
				if (userSockets) {
					userSockets.delete(socket.id);
					if (userSockets.size === 0) {
						onlineUsers.delete(userId);
						// Broadcast user offline to all connected clients
						socket.broadcast.emit('user:offline', { userId });
					}
				}
			}
		});

		// join rooms on request
		socket.on('chat:join', async (payload: { chatId: string }) => {
			try {
				const { chatId } = payload;
				const ok = await canJoinChat(socket, chatId);
				if (!ok) return socket.emit('chat:room:joined', { chatId, ok: false, reason: 'not_participant' });
				socket.join(`chat_${chatId}`);
				socket.emit('chat:room:joined', { chatId, ok: true });
			} catch (err) {
				socket.emit('chat:room:joined', { ok: false, reason: 'error' });
			}
		});

		socket.on('chat:message:new', async (payload: any) => {
			try {
				const { chatId, text, attachments } = payload;
				const userId = (socket as any).user?.id;
				const ok = await canJoinChat(socket, chatId);
				if (!ok) return socket.emit('error', 'not_allowed');

				const msg = await chatService.addMessage(chatId, userId, text, attachments);
				io?.to(`chat_${chatId}`).emit('chat:message:new', { message: msg });
			} catch (err) {
				socket.emit('error', String(err));
			}
		});

		socket.on('chat:typing:start', (payload: { chatId: string }) => {
			const { chatId } = payload;
			socket.to(`chat_${chatId}`).emit('chat:typing:start', { user: { id: (socket as any).user?.id, name: (socket as any).user?.name } });
		});

		socket.on('chat:typing:stop', (payload: { chatId: string }) => {
			const { chatId } = payload;
			socket.to(`chat_${chatId}`).emit('chat:typing:stop', { user: { id: (socket as any).user?.id } });
		});

		socket.on('chat:message:read', async (payload: { chatId: string; messageId: string }) => {
			try {
				const { chatId, messageId } = payload;
				const ok = await canJoinChat(socket, chatId);
				if (!ok) return;
				const m = await chatService.markMessageRead(messageId, (socket as any).user?.id);
				io?.to(`chat_${chatId}`).emit('chat:message:read', { messageId, readerId: (socket as any).user?.id, readAt: m.readAt });
			} catch (err) {
				// ignore
			}
		});
	});

	return io;
}

export default init;
