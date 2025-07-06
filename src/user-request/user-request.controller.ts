import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { UserRequestService } from "./user-request.service";
import { CreateRequestDto } from "./dto/create-request.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('user-request')
export class UserRequestController {

  constructor(private readonly userRequestService: UserRequestService) {
  }

  @Post()
  createRequest(@Body() dto: CreateRequestDto) {
    return this.userRequestService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/set-checked/:id')
  setChecked(@Param('id') id: number) {
    return this.userRequestService.setChecked(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getRequest(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 1,
  ) {
    return this.userRequestService.getUserRequests(limit, page);
  }
}
