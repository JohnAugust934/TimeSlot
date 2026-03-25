import { IsDateString, IsString } from 'class-validator';

export class GetAvailableSlotsDto {
  @IsString()
  professionalId!: string;

  @IsString()
  serviceId!: string;

  @IsDateString()
  date!: string;
}
