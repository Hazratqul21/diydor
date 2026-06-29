import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import {
  UpdateConfigDto,
  UpdatePaymentConfigDto,
  UploadWelcomeImageDto,
  UpsertPlanDto,
} from './dto/admin.dto';
import { Public } from '../auth/public.decorator';

@Public() // global user JWT guardni o'tkazib yuborish
@UseGuards(AdminGuard) // admin JWT majburiy
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.getStats();
  }

  // ── Users ──
  @Get('users')
  users(@Query('q') q?: string, @Query('page') page?: string) {
    return this.admin.listUsers(q, page ? Number(page) : 1);
  }

  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Post('users/:id/ban')
  ban(@Param('id') id: string) {
    return this.admin.setBan(id, true);
  }

  @Post('users/:id/unban')
  unban(@Param('id') id: string) {
    return this.admin.setBan(id, false);
  }

  @Post('users/:id/verify')
  verify(@Param('id') id: string) {
    return this.admin.setVerify(id, true);
  }

  @Post('users/:id/unverify')
  unverify(@Param('id') id: string) {
    return this.admin.setVerify(id, false);
  }

  // ── Config (sozlamalar) ──
  @Get('config')
  getConfig() {
    return this.admin.getConfig();
  }

  @Put('config')
  updateConfig(@Body() dto: UpdateConfigDto) {
    return this.admin.updateConfig(dto);
  }

  // ── Branding (Welcome ekrani rasmi) ──
  @Post('branding/welcome-image')
  uploadWelcomeImage(@Body() dto: UploadWelcomeImageDto) {
    return this.admin.uploadWelcomeImage(dto.dataUrl);
  }

  // ── To'lov rekvizitlari (Payme) ──
  @Get('payment-config')
  getPaymentConfig() {
    return this.admin.getPaymentConfig();
  }

  @Put('payment-config')
  updatePaymentConfig(@Body() dto: UpdatePaymentConfigDto) {
    return this.admin.updatePaymentConfig(dto);
  }

  // ── Pul yechish so'rovlari ──
  @Get('withdrawals')
  withdrawals(@Query('status') status?: string, @Query('page') page?: string) {
    return this.admin.listWithdrawals(status, page ? +page : 1);
  }

  @Post('withdrawals/:id/paid')
  withdrawalPaid(@Param('id') id: string) {
    return this.admin.markWithdrawalPaid(id);
  }

  @Post('withdrawals/:id/reject')
  withdrawalReject(@Param('id') id: string, @Body() body: { note?: string }) {
    return this.admin.rejectWithdrawal(id, body?.note);
  }

  // ── Subscription plans ──
  @Get('plans')
  plans() {
    return this.admin.listPlans();
  }

  @Put('plans')
  upsertPlan(@Body() dto: UpsertPlanDto) {
    return this.admin.upsertPlan(dto);
  }

  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.admin.deletePlan(id);
  }

  // ── To'lovlar ──
  @Get('orders')
  orders(@Query('page') page?: string) {
    return this.admin.listOrders(page ? Number(page) : 1);
  }

  // ── Xavfsizlik / shikoyatlar ──
  @Get('reports')
  reports(@Query('page') page?: string) {
    return this.admin.listReports(page ? Number(page) : 1);
  }

  @Delete('reports/:id')
  resolveReport(@Param('id') id: string) {
    return this.admin.resolveReport(id);
  }
}
