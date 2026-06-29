import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  /** Akkahuntni butunlay o'chirish (App Store talabi). */
  @Delete('me')
  deleteMe(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }

  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  /** Selfie verifikatsiya (FastAPI orqali) */
  @Post('me/verify')
  @UseInterceptors(FileInterceptor('file'))
  verify(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Rasm yuklanmadi');
    }
    return this.usersService.verifySelfie(userId, file);
  }

  /** Boshqa userning ochiq profili (':id' 'me' dan keyin e'lon qilingan) */
  @Get(':id')
  publicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
