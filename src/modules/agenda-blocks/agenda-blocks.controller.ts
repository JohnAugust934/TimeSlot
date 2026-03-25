import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { AgendaBlocksService } from './agenda-blocks.service';
import { CreateAgendaBlockDto } from './dto/create-agenda-block.dto';
import { ListAgendaBlocksDto } from './dto/list-agenda-blocks.dto';

@Controller({ path: 'agenda-blocks', version: '1' })
export class AgendaBlocksController {
  constructor(private readonly agendaBlocksService: AgendaBlocksService) {}

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Post()
  create(@Body() body: CreateAgendaBlockDto) {
    return this.agendaBlocksService.create(body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get()
  findAll(@Query() query: ListAgendaBlocksDto) {
    return this.agendaBlocksService.findAll(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agendaBlocksService.remove(id);
  }
}
