import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginAdminDto } from "./dto/login-admin.dto";
import { AdminAuthGuard } from "./guards/admin-auth.guard";
import { ProfileAuthGuard } from "./guards/profile-auth.guard";

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {
  }

  @Post('/login')
  login(@Body() loginDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginDto);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/checkAct')
  checkAct() {
    return { isValid: true };
  }

  @UseGuards(ProfileAuthGuard)
  @Get('/checkProfileAct')
  checkProfileAct() {
    return { isValid: true };
  }

}