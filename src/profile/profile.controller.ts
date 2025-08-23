import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, ValidationPipe } from "@nestjs/common";
import { ProfileService } from "./services/profile.service";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { UpdatePartnerStatusDto } from "./dto/update-partner-status.dto";
import { GetPartnersProfileDto } from "./dto/get-partners-profile.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { LoginProfileDto } from "../auth/dto/login-profile.dto";
import { RequestEmailUpdateDto } from "./dto/request-email-update.dto";
import { ConfirmedEmailUpdateDto } from "./dto/confirm-email-update.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { ProfileId } from "../decorators/profile-id.decorator";
import { ProfileGuard } from "../auth/guards/profile.guard";
import { ProfileUpdatesService } from "./services/profile-updates.service";
import { ProfileGettersService } from "./services/profile-getters.service";
import { ResetPasswordEmailDto } from "./dto/reset-password/reset-password-email.dto";
import { ConfirmResetDto } from "./dto/reset-password/confirm-reset.dto";

@Controller('profile')
export class ProfileController {

  constructor(
    private readonly profileService: ProfileService,
    private readonly profileUpdatesService: ProfileUpdatesService,
    private readonly profileGettersService: ProfileGettersService,
  ) {}

  @Post('/partner')
  createPartnerProfile(@Body() dto: CreatePartnerDto) {
    return this.profileService.createPartner(dto);
  }

  @Post('/login')
  login(@Body() dto: LoginProfileDto) {
    return this.profileService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/partner-status')
  updatePartnerProfileStatus(@Body() dto: UpdatePartnerStatusDto) {
    return this.profileUpdatesService.updatePartnerProfileStatus(dto.id, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/partners')
  getPartnersProfiles(@Query(new ValidationPipe({ transform: true })) query: GetPartnersProfileDto) {
    return this.profileGettersService.getPartnerProfiles(query);
  }

  @UseGuards(ProfileGuard)
  @Post('/update-email')
  requestUpdateEmail(@ProfileId() id: string, @Body() dto: RequestEmailUpdateDto) {
    return this.profileService.requestEmailUpdate(id, dto);
  }

  @Post('/confirm-email')
  confirmUpdateEmail(@Body() dto: ConfirmedEmailUpdateDto) {
    return this.profileService.confirmEmailUpdate(dto);
  }

  @Post('/reset-password-by-email')
  resetPasswordByEmail(@Body() dto: ResetPasswordEmailDto) {
    return this.profileService.requestResetPasswordByEmail(dto);
  }

  @Put('/confirm-new-password')
  confirmResetPassword(@Body() dto: ConfirmResetDto) {
    return this.profileService.confirmResetPassword(dto);
  }

  @UseGuards(ProfileGuard)
  @Post('/update-password')
  updatePassword(
    @ProfileId() id: string,
    @Body() dto: UpdatePasswordDto
  ) {
    return this.profileUpdatesService.updatePassword(id, dto);
  }

  @UseGuards(ProfileGuard)
  @Get()
  getProfile(
    @ProfileId() id: string,
  ) {
    return this.profileGettersService.getProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  deleteProfile(@Param('id') id: string) {
    return this.profileUpdatesService.deleteProfile(id);
  }
}
