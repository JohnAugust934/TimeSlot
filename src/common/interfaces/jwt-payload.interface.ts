import type { AppRole } from '../enums/app-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AppRole;
}
