import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Controller({ path: 'appointments', version: '1' })
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Post()
  create(
    @Body() body: CreateAppointmentDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.appointmentsService.create(body, user.sub, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get()
  findAll(@Query() query: ListAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get('available-slots')
  getAvailableSlots(@Query() query: GetAvailableSlotsDto) {
    return this.appointmentsService.getAvailableSlots(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL, AppRole.CLIENT)
  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() body: CancelAppointmentDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.appointmentsService.cancel(id, body, user.sub, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() body: RescheduleAppointmentDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.appointmentsService.reschedule(id, body, user.sub, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateAppointmentStatusDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.appointmentsService.updateStatus(id, body, user.sub, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }
}
