import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { mapUserRole } from './utils/map-user-role';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginDto) {
    const user = await this.validateCredentials(input.email, input.password);
    const payload = this.buildJwtPayload(user);
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: this.toAuthenticatedUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.active) {
      throw new UnauthorizedException('Authenticated user not found or inactive.');
    }

    return this.toAuthenticatedUser(user);
  }

  getProtectedExample(user: JwtPayload) {
    return {
      message: 'You have accessed a protected route.',
      user,
    };
  }

  private async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.active) {
      throw new UnauthorizedException('User is inactive.');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return user;
  }

  private buildJwtPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: mapUserRole(user.role),
    };
  }

  private toAuthenticatedUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: mapUserRole(user.role),
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
