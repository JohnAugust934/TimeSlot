import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { ListAvailabilitiesDto } from './dto/list-availabilities.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller({ path: 'availabilities', version: '1' })
export class AvailabilitiesController {
  constructor(private readonly availabilitiesService: AvailabilitiesService) {}

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Post()
  create(@Body() body: CreateAvailabilityDto) {
    return this.availabilitiesService.create(body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get()
  findAll(@Query() query: ListAvailabilitiesDto) {
    return this.availabilitiesService.findAll(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAvailabilityDto) {
    return this.availabilitiesService.update(id, body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.availabilitiesService.remove(id);
  }
}
