import { Injectable } from '@nestjs/common';

@Injectable()
export class WaitlistService {
  getModuleInfo() {
    return {
      module: 'waitlist',
      status: 'ready',
      description: 'Domain module prepared for future waiting-list workflows.',
    };
  }
}
