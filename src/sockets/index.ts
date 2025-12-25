import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../lib/logger';

let io: SocketServer | null = null;

// Track online users: userId -> Set of socket IDs (user can have multiple devices)
const onlineUsers = new Map<string, Set<string>>();

export async function initSocketServer(server: any): Promise<SocketServer> {
    io = new SocketServer(server, {
        cors: {
            origin: config.CORS_ORIGINS.split(','),
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
    });

    // Setup Redis adapter for horizontal scaling
    try {
        const pubClient = createClient({ url: config.REDIS_URL });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);

        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.io Redis adapter connected');
    } catch (error) {
        logger.warn({ error }, 'Redis adapter failed, using in-memory adapter');
    }

    io.on('connection', (socket) => {
        logger.info({ socketId: socket.id }, 'Socket connected');

        // User authenticates after connection
        socket.on('authenticate', (data: { userId: string; userType: 'user' | 'driver' | 'store' }) => {
            const { userId, userType } = data;

            if (!userId) {
                socket.emit('error', { message: 'userId required' });
                return;
            }

            // Store user info on socket
            socket.data.userId = userId;
            socket.data.userType = userType;

            // Join user-specific room
            socket.join(`user:${userId}`);
            socket.join(`type:${userType}`);

            // Track online status
            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId)!.add(socket.id);

            logger.info({ userId, userType, socketId: socket.id }, 'User authenticated');
            socket.emit('authenticated', { success: true });
        });

        socket.on('disconnect', () => {
            const userId = socket.data.userId;
            if (userId && onlineUsers.has(userId)) {
                onlineUsers.get(userId)!.delete(socket.id);
                if (onlineUsers.get(userId)!.size === 0) {
                    onlineUsers.delete(userId);
                }
            }
            logger.info({ socketId: socket.id, userId }, 'Socket disconnected');
        });
    });

    logger.info('Socket.io server initialized');
    return io;
}

export function getIO(): SocketServer | null {
    return io;
}

export function isUserOnline(userId: string): boolean {
    return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

export function getOnlineUsersCount(): number {
    return onlineUsers.size;
}

// Emit to specific user
export function emitToUser(userId: string, event: string, data: any): boolean {
    if (!io) return false;
    io.to(`user:${userId}`).emit(event, data);
    return isUserOnline(userId);
}

// Emit to all users of a type
export function emitToUserType(userType: 'user' | 'driver' | 'store', event: string, data: any): void {
    if (!io) return;
    io.to(`type:${userType}`).emit(event, data);
}

// Emit to all connected clients
export function emitToAll(event: string, data: any): void {
    if (!io) return;
    io.emit(event, data);
}
