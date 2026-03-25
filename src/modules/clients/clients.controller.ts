import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller({ path: 'clients', version: '1' })
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Post()
  create(@Body() body: CreateClientDto) {
    return this.clientsService.create(body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get()
  findAll(@Query() query: ListClientsDto) {
    return this.clientsService.findAll(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateClientDto) {
    return this.clientsService.update(id, body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.clientsService.deactivate(id);
  }
}
