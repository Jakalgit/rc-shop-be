import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { ProfileId } from "../decorators/profile-id.decorator";
import { OrderService } from "./order.service";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { ProfileAuthGuard } from "../auth/guards/profile-auth.guard";
import { ProfileDetectGuard } from "../auth/guards/profile-detect.guard";

@Controller('order')
export class OrderController {

  constructor(private readonly orderService: OrderService) {
  }

  @UseGuards(ProfileDetectGuard)
  @Post('/')
  create(
    @ProfileId() profileId: string | undefined,
    @Body() dto: CreateOrderDto
  ) {
    return this.orderService.create(dto, profileId);
  }

  @Get('/by-number/:orderNumber')
  getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.getOrderByNumber(orderNumber);
  }

  @UseGuards(ProfileAuthGuard)
  @Get('/by-profile')
  getOrderByProfileId(
    @ProfileId() profileId: string | undefined,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 1,
  ) {
    return this.orderService.getOrdersByProfileId(profileId, page, limit);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/all')
  getAllOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 24,
  ) {
    return this.orderService.getAllOrders(page, limit);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/adm/by-number/:orderNumber')
  getOrderAdmByNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.getOrderByNumber(orderNumber, true);
  }
}
