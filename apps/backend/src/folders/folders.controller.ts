import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@Controller('folders')
@UseGuards(SupabaseAuthGuard)
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.foldersService.findAll(req.user.id, req.token);
  }

  @Post()
  create(
    @Body() body: { name: string; icon?: string; color?: string },
    @Req() req: any,
  ) {
    return this.foldersService.create(body, req.user.id, req.token);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.foldersService.remove(id, req.user.id, req.token);
  }
}
