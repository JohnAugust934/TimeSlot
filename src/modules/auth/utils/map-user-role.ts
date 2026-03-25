import { UserRole } from '@prisma/client';

import { AppRole } from '../../../common/enums/app-role.enum';

export function mapUserRole(role: UserRole): AppRole {
  switch (role) {
    case UserRole.ADMIN:
      return AppRole.ADMIN;
    case UserRole.RECEPTIONIST:
      return AppRole.RECEPTIONIST;
    case UserRole.PROFESSIONAL:
      return AppRole.PROFESSIONAL;
    case UserRole.CLIENT:
      return AppRole.CLIENT;
    default:
      return AppRole.CLIENT;
  }
}
