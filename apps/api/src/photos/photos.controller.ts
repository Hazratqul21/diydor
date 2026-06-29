import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.photos.listMine(userId);
  }

  @Post()
  add(@CurrentUser('id') userId: string, @Body() dto: CreatePhotoDto) {
    return this.photos.addPhoto(userId, dto.dataUrl);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.photos.remove(userId, id);
  }
}
