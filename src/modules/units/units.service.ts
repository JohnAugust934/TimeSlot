import { Injectable } from '@nestjs/common';

@Injectable()
export class UnitsService {
  getModuleInfo() {
    return {
      module: 'units',
      status: 'ready',
      description: 'Domain module prepared for multi-unit scheduling.',
    };
  }
}
