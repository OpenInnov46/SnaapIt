import { Controller, Get, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Redirect()
  redirectToApp() {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3001');
    return { url: appUrl, statusCode: 302 };
  }
}
