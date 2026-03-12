import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow('OPENAI_API_KEY'),
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async generateTagsAndFolder(
    title: string,
    description: string,
    url: string,
    existingFolders: string[],
  ): Promise<{ tags: string[]; suggestedFolder: string }> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a bookmark organizer. Given a bookmark's title, description, and URL, return a JSON object with:
- "tags": an array of 2-5 short, relevant tags (lowercase)
- "suggestedFolder": a single folder name that best categorizes this bookmark

If the bookmark fits an existing folder, use that folder name exactly. Otherwise suggest a new one.

Existing folders: ${existingFolders.length > 0 ? existingFolders.join(', ') : 'none yet'}`,
        },
        {
          role: 'user',
          content: `Title: ${title}\nDescription: ${description || 'N/A'}\nURL: ${url}`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content || '{}');

    return {
      tags: parsed.tags || [],
      suggestedFolder: parsed.suggestedFolder || 'Uncategorized',
    };
  }
}
