import { Module } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { OpenAiModule } from '../openai/openai.module';

@Module({
  imports: [SupabaseModule, OpenAiModule],
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
