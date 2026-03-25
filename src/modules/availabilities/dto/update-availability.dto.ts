import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekday?: number;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(8)
  startTime?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(8)
  endTime?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  slotMinutes?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
