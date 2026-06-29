import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REPORT_REASONS = [
  'SPAM',
  'FAKE',
  'INAPPROPRIATE',
  'HARASSMENT',
  'UNDERAGE',
  'OTHER',
] as const;

export class CreateReportDto {
  @IsString() reportedId: string;
  @IsIn(REPORT_REASONS as unknown as string[]) reason: string;
  @IsOptional() @IsString() @MaxLength(1000) details?: string;
}

export class BlockDto {
  @IsString() blockedId: string;
}
