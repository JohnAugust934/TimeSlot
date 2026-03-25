import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { DashboardPeriodFiltersDto } from './dashboard-period-filters.dto';

export class UpcomingAppointmentsFiltersDto extends DashboardPeriodFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
