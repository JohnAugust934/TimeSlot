import { Module } from '@nestjs/common';

import { AppointmentHistoryService } from './appointment-history.service';

@Module({
  providers: [AppointmentHistoryService],
  exports: [AppointmentHistoryService],
})
export class AppointmentHistoryModule {}
