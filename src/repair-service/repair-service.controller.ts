import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UpdateServiceDto } from "./dto/update-services.dto";
import { RepairService_Service } from "./repair-service.service";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";

@Controller('repair-service')
export class RepairServiceController {

  constructor(private readonly repairService: RepairService_Service) {
  }

  @UseGuards(AdminAuthGuard)
  @Post()
  setNewServices(@Body() dto: UpdateServiceDto) {
    return this.repairService.setNew(dto);
  }

  @Get()
  getRepairServices() {
    return this.repairService.getServices();
  }
}
