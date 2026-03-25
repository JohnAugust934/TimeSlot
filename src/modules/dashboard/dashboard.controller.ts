import { Controller, Get, Query } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { DashboardService } from './dashboard.service';
import { DashboardDayFiltersDto } from './dto/dashboard-day-filters.dto';
import { DashboardPeriodFiltersDto } from './dto/dashboard-period-filters.dto';
import { UpcomingAppointmentsFiltersDto } from './dto/upcoming-appointments-filters.dto';

@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get('today-appointments')
  getTodayAppointments(@Query() query: DashboardDayFiltersDto) {
    return this.dashboardService.getTodayAppointments(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get('upcoming-appointments')
  getUpcomingAppointments(@Query() query: UpcomingAppointmentsFiltersDto) {
    return this.dashboardService.getUpcomingAppointments(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get('no-shows')
  getNoShows(@Query() query: DashboardPeriodFiltersDto) {
    return this.dashboardService.getNoShows(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get('cancellations')
  getCancellations(@Query() query: DashboardPeriodFiltersDto) {
    return this.dashboardService.getCancellations(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get('new-clients')
  getNewClients(@Query() query: DashboardPeriodFiltersDto) {
    return this.dashboardService.getNewClients(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get('professional-occupancy')
  getProfessionalOccupancy(@Query() query: DashboardPeriodFiltersDto) {
    return this.dashboardService.getProfessionalOccupancy(query);
  }
}
