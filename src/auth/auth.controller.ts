import { Controller, Get, Req, UseGuards, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LogInDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req);
  }

  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto): Promise<{
    token: string;
  }> {
    return this.authService.signUp(signUpDto);
  }

  @Post('/login')
  LogIn(@Body() LogInDto: LogInDto): Promise<{ token: string }> {
    return this.authService.LogIn(LogInDto);
  }
}
