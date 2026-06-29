import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  notifyNewMessage(recipientId: string, message: any) {
    this.server.to(`user_${recipientId}`).emit('newMessage', message);
  }

  /** Yangi match haqida foydalanuvchini real-time xabardor qiladi. */
  notifyNewMatch(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('newMatch', payload);
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
