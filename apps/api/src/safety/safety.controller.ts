import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateReportDto, BlockDto } from './dto';

@Controller()
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  @Post('reports')
  report(@CurrentUser('id') meId: string, @Body() dto: CreateReportDto) {
    return this.safety.report(meId, dto.reportedId, dto.reason, dto.details);
  }

  @Post('blocks')
  block(@CurrentUser('id') meId: string, @Body() dto: BlockDto) {
    return this.safety.block(meId, dto.blockedId);
  }

  @Delete('blocks/:userId')
  unblock(@CurrentUser('id') meId: string, @Param('userId') userId: string) {
    return this.safety.unblock(meId, userId);
  }

  @Get('blocks')
  listBlocked(@CurrentUser('id') meId: string) {
    return this.safety.listBlocked(meId);
  }
}
