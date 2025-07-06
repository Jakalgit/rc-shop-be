import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {
  }

  @Post('/login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/checkAct')
  checkAct() {
    return { isValid: true };
  }

}