import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePhotoDto {
  /** data:image/jpeg;base64,... ko'rinishidagi rasm */
  @IsString()
  @IsNotEmpty()
  dataUrl: string;
}
