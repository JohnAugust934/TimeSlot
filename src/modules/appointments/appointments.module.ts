import { Module } from '@nestjs/common';

import { AppointmentHistoryModule } from '../appointment-history/appointment-history.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [AppointmentHistoryModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
