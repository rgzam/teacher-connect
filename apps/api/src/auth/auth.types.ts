import type { UserRole } from '@teacher-connect/types';

export interface AuthJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface PublicTeacher {
  id: string;
  firstName: string;
  lastName: string;
  bookingSlug: string;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  teacher: PublicTeacher | null;
}
