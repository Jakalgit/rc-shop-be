import { Module } from '@nestjs/common';
import { RepairServiceController } from './repair-service.controller';
import { RepairServiceService } from './repair-service.service';

@Module({
  controllers: [RepairServiceController],
  providers: [RepairServiceService]
})
export class RepairServiceModule {}
