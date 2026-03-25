import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAvailabilityDto {
  @IsString()
  professionalId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @IsString()
  @MinLength(5)
  @MaxLength(8)
  startTime!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(8)
  endTime!: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  slotMinutes?: number;
}
