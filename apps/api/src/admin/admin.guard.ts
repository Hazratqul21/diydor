import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Admin endpointlarini himoyalaydi. Admin JWT (`typ: 'admin'`) ni tekshiradi
 * va aktiv admin ekanini DB'dan tasdiqlaydi. User tokeni bu yerga o'tmaydi.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Token yo\'q');

    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(header.slice(7), {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret-ozgartiring',
      });
    } catch {
      throw new UnauthorizedException('Token yaroqsiz');
    }

    if (payload.typ !== 'admin') throw new UnauthorizedException('Admin huquqi yo\'q');

    const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.isActive) throw new UnauthorizedException('Admin topilmadi yoki bloklangan');

    req.admin = admin;
    return true;
  }
}
