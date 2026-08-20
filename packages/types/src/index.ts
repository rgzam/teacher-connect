export const API_PREFIX = '/api';

export interface HealthResponse {
  status: 'ok';
  service: 'teacher-connect-api';
  timestamp: string;
}

export type UserRole = 'TEACHER' | 'ADMIN';
export type ContactPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
export type ContactStatus =
  | 'NOT_CONTACTED'
  | 'ATTEMPTED'
  | 'REACHED'
  | 'FOLLOW_UP_REQUIRED'
  | 'COMPLETED';
