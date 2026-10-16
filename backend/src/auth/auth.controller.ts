import { Controller, Post, Body, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Request() req: any, @Body() _dto: LoginDto) {
    // LocalAuthGuard ya validó las credenciales y adjuntó req.user
    return this.authService.login(req.user);
  }
}
