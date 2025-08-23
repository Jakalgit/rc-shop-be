import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginAdminDto } from "./dto/login-admin.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { ProfileGuard } from "./guards/profile.guard";

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {
  }

  @Post('/login')
  login(@Body() loginDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/checkAct')
  checkAct() {
    return { isValid: true };
  }

  @UseGuards(ProfileGuard)
  @Get('/checkProfileAct')
  checkProfileAct() {
    return { isValid: true };
  }

}