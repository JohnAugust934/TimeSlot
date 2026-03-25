export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'PROFESSIONAL' | 'CLIENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
