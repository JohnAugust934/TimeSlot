import { AppointmentStatus, ConfirmationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @IsOptional()
  @IsEnum(ConfirmationStatus)
  confirmationStatus?: ConfirmationStatus;
}
