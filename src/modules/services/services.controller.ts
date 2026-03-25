import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesDto } from './dto/list-services.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller({ path: 'services', version: '1' })
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Post()
  create(@Body() body: CreateServiceDto) {
    return this.servicesService.create(body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get()
  findAll(@Query() query: ListServicesDto) {
    return this.servicesService.findAll(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.servicesService.update(id, body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.servicesService.deactivate(id);
  }
}
