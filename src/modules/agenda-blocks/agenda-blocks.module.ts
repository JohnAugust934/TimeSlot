import { Module } from '@nestjs/common';

import { AgendaBlocksController } from './agenda-blocks.controller';
import { AgendaBlocksService } from './agenda-blocks.service';

@Module({
  controllers: [AgendaBlocksController],
  providers: [AgendaBlocksService],
  exports: [AgendaBlocksService],
})
export class AgendaBlocksModule {}
