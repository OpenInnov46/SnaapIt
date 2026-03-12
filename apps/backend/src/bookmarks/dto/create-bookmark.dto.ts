import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateBookmarkDto {
  @IsUrl()
  url: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  favicon_url?: string;
}
