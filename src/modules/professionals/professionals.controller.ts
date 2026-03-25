import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { ListProfessionalsDto } from './dto/list-professionals.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { ProfessionalsService } from './professionals.service';

@Controller({ path: 'professionals', version: '1' })
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Post()
  create(@Body() body: CreateProfessionalDto) {
    return this.professionalsService.create(body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get()
  findAll(@Query() query: ListProfessionalsDto) {
    return this.professionalsService.findAll(query);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST, AppRole.PROFESSIONAL)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProfessionalDto) {
    return this.professionalsService.update(id, body);
  }

  @Roles(AppRole.ADMIN, AppRole.RECEPTIONIST)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.professionalsService.deactivate(id);
  }
}
