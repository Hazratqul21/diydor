import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const tokenStr = client.handshake.auth?.token || client.handshake.headers.authorization;
      const token = tokenStr?.startsWith('Bearer ') ? tokenStr.split(' ')[1] : tokenStr;

      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET') ?? 'dev-secret-ozgartiring';
      const payload = this.jwtService.verify(token, { secret });

      const userId = payload.sub;
      client.data.userId = userId;
      client.join(`user_${userId}`);
      this.logger.log(`Socket connected: ${client.id} (user: ${userId})`);
    } catch (e) {
      this.logger.error(`Socket connection error: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  // ─────────────── Typing indikatori ───────────────

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { matchId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId || !data.matchId) return;

    const match = await this.prisma.match.findUnique({
      where: { id: data.matchId },
      select: { userAId: true, userBId: true, closedAt: true },
    });
    if (!match || match.closedAt) return;

    const recipientId = match.userAId === userId ? match.userBId : match.userAId;
    this.server.to(`user_${recipientId}`).emit('userTyping', {
      matchId: data.matchId,
      userId,
      isTyping: data.isTyping,
    });
  }

  // ─────────────── Xabar o'qildi ───────────────

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @MessageBody() data: { messageId: string; matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId || !data.messageId || !data.matchId) return;

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
      select: { senderId: true, matchId: true, readAt: true },
    });

    // Faqat boshqa foydalanuvchining xabarini o'qildi deb belgilash mumkin
    if (!message || message.matchId !== data.matchId || message.senderId === userId) return;
    // Allaqachon o'qilgan bo'lsa, qayta yangilamaslik
    if (message.readAt) return;

    const now = new Date();
    await this.prisma.message.update({
      where: { id: data.messageId },
      data: { readAt: now, status: 'READ' },
    });

    this.server.to(`user_${message.senderId}`).emit('messageRead', {
      messageId: data.messageId,
      matchId: data.matchId,
      readAt: now.toISOString(),
    });
  }

  // ─────────────── Xabar yetkazildi ───────────────

  @SubscribeMessage('messageDelivered')
  async handleMessageDelivered(
    @MessageBody() data: { messageId: string; matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId || !data.messageId || !data.matchId) return;

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
      select: { senderId: true, matchId: true, deliveredAt: true },
    });

    // Faqat boshqa foydalanuvchining xabariga delivered belgilash mumkin
    if (!message || message.matchId !== data.matchId || message.senderId === userId) return;
    // Allaqachon yetkazilgan bo'lsa, qayta yangilamaslik
    if (message.deliveredAt) return;

    const now = new Date();
    await this.prisma.message.update({
      where: { id: data.messageId },
      data: { deliveredAt: now, status: 'DELIVERED' },
    });

    this.server.to(`user_${message.senderId}`).emit('messageDelivered', {
      messageId: data.messageId,
      matchId: data.matchId,
      deliveredAt: now.toISOString(),
    });
  }

  // ─────────────── Xabarga reaksiya (Like) ───────────────

  @SubscribeMessage('likeMessage')
  async handleLikeMessage(
    @MessageBody() data: { messageId: string; matchId: string; liked: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId || !data.messageId || !data.matchId) return;

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
      select: { senderId: true, matchId: true },
    });

    if (!message || message.matchId !== data.matchId) return;

    // Like bosganda bazada yangilaymiz
    await this.prisma.message.update({
      where: { id: data.messageId },
      data: { liked: data.liked },
    });

    // Match'dagi ikkala odamga ham xabar statusini yuboramiz
    const match = await this.prisma.match.findUnique({
      where: { id: data.matchId },
      select: { userAId: true, userBId: true },
    });
    if (match) {
      this.server.to(`user_${match.userAId}`).to(`user_${match.userBId}`).emit('messageLiked', {
        messageId: data.messageId,
        matchId: data.matchId,
        liked: data.liked,
      });
    }
  }

  // ─────────────── Public helpers ───────────────

  notifyNewMessage(recipientId: string, message: any) {
    this.server.to(`user_${recipientId}`).emit('newMessage', message);
  }

  /** Yangi match haqida foydalanuvchini real-time xabardor qiladi. */
  notifyNewMatch(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('newMatch', payload);
  }

  notifyMessageUpdated(recipientId: string, payload: { messageId: string, content: string }) {
    this.server.to(`user_${recipientId}`).emit('messageUpdated', payload);
  }

  notifyMessageDeleted(recipientId: string, payload: { messageId: string }) {
    this.server.to(`user_${recipientId}`).emit('messageDeleted', payload);
  }

  /** Foydalanuvchi hozir online'mi (kamida bitta socket ulangan). */
  async isOnline(userId: string): Promise<boolean> {
    try {
      const sockets = await this.server.in(`user_${userId}`).fetchSockets();
      return sockets.length > 0;
    } catch {
      return false;
    }
  }
}
