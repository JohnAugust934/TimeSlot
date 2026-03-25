import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  professionalId!: string;

  @IsString()
  clientId!: string;

  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;

  @IsOptional()
  @IsString()
  createdByUserId?: string;
}
