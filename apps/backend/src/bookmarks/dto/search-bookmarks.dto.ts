import { IsString, IsOptional, IsNumberString } from 'class-validator';

export class SearchBookmarksDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsNumberString()
  threshold?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
