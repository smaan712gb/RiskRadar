import type { Permission, SystemRole } from '../constants/roles';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: SystemRole;
  permissions: Permission[];
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: SystemRole;
  permissions: Permission[];
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: SystemRole;
}

export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: SystemRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}
