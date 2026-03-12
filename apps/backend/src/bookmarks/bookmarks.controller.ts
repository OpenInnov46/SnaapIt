import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('bookmarks')
@UseGuards(SupabaseAuthGuard)
export class BookmarksController {
  constructor(private bookmarksService: BookmarksService) {}

  @Post()
  create(@Body() dto: CreateBookmarkDto, @Req() req: any) {
    return this.bookmarksService.create(dto, req.user.id, req.token);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarksService.findAll(
      req.user.id,
      req.token,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('search')
  search(
    @Query('q') q: string,
    @Query('threshold') threshold: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    return this.bookmarksService.search(
      q,
      req.user.id,
      req.token,
      threshold ? parseFloat(threshold) : 0.5,
      limit ? parseInt(limit) : 10,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updates: Partial<{ title: string; description: string; tags: string[]; folder_id: string }>,
    @Req() req: any,
  ) {
    return this.bookmarksService.update(id, updates, req.user.id, req.token);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.bookmarksService.remove(id, req.user.id, req.token);
  }
}
