export const API_PREFIX = '/api';

export interface HealthResponse {
  status: 'ok';
  service: 'teacher-connect-api';
  timestamp: string;
}

export type UserRole = 'TEACHER' | 'ADMIN';

export interface AuthTeacher {
  id: string;
  firstName: string;
  lastName: string;
  bookingSlug: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  teacher: AuthTeacher | null;
}

export interface LoginResponse {
  user: AuthUser;
}
export type ContactReason =
  | 'ACADEMIC_CONCERN'
  | 'MISSING_ASSIGNMENTS'
  | 'ATTENDANCE'
  | 'BEHAVIOR'
  | 'POSITIVE_UPDATE'
  | 'STUDENT_IMPROVEMENT'
  | 'GENERAL_QUESTION'
  | 'PARENT_REQUESTED'
  | 'TEACHER_REQUESTED_CONFERENCE'
  | 'OTHER';

export type ContactPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
export type ContactStatus =
  | 'NOT_CONTACTED'
  | 'ATTEMPTED'
  | 'REACHED'
  | 'FOLLOW_UP_REQUIRED'
  | 'COMPLETED';

export interface DashboardCounts {
  appointmentsToday: number;
  callsToMake: number;
  overdueFollowUps: number;
  highPriority: number;
}

export interface DashboardAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  typeName: string;
  reason: string | null;
  studentName: string | null;
  guardianName: string | null;
}

export interface DashboardContactTask {
  id: string;
  reason: ContactReason;
  priority: ContactPriority;
  status: ContactStatus;
  dueDate: string;
  followUpDate: string | null;
  isOverdue: boolean;
  studentName: string;
  guardianName: string;
}

export interface DashboardActivity {
  id: string;
  contactedAt: string;
  method: string;
  outcome: string;
  notes: string | null;
  studentName: string;
}

export type ContactMethod = 'PHONE' | 'EMAIL' | 'IN_PERSON' | 'VIDEO' | 'OTHER';
export type ContactOutcome =
  | 'REACHED'
  | 'NO_ANSWER'
  | 'LEFT_VOICEMAIL'
  | 'EMAIL_SENT'
  | 'DECLINED'
  | 'OTHER';

export interface StudentGuardian {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  notes: string | null;
  openTaskCount: number;
  guardians: StudentGuardian[];
}

export interface ContactTaskSummary {
  id: string;
  reason: ContactReason;
  priority: ContactPriority;
  status: ContactStatus;
  dueDate: string;
  followUpDate: string | null;
  attemptCount: number;
  lastContactAt: string | null;
  notes: string | null;
  student: { id: string; firstName: string; lastName: string };
  guardian: { id: string; firstName: string; lastName: string } | null;
}

export interface ContactLogEntry {
  id: string;
  method: ContactMethod;
  outcome: ContactOutcome;
  notes: string | null;
  contactedAt: string;
}

export interface ContactTaskDetail extends ContactTaskSummary {
  logs: ContactLogEntry[];
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  notes?: string;
  guardian?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateContactTaskInput {
  studentId: string;
  guardianId?: string;
  reason: ContactReason;
  priority: ContactPriority;
  dueDate: string;
  notes?: string;
}

export interface RecordContactInput {
  method: ContactMethod;
  outcome: ContactOutcome;
  notes?: string;
  followUpDate?: string;
  complete?: boolean;
}

export interface ScheduleWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export type MeetingFormat = 'VIRTUAL' | 'HOME_VISIT';

export interface AppointmentTypeOption {
  id: string;
  name: string;
  durationMinutes: number;
  description: string | null;
  format: MeetingFormat;
}

export interface TeacherSchedule {
  firstName: string;
  lastName: string;
  timezone: string;
  bookingSlug: string;
  bufferMinutes: number;
  minNoticeHours: number;
  maxBookingDays: number;
  windows: ScheduleWindow[];
  types: AppointmentTypeOption[];
  blockedDates: { id: string; date: string; reason: string | null }[];
  calendar: {
    configured: boolean;
    connected: boolean;
    email: string | null;
  };
}

export interface PublicTeacher {
  firstName: string;
  lastName: string;
  schoolName: string | null;
  timezone: string;
  bookingSlug: string;
  types: AppointmentTypeOption[];
}

export interface PublicSlot {
  startsAt: string;
  endsAt: string;
}

export interface PublicSlotDay {
  date: string;
  slots: PublicSlot[];
}

export interface PublicSlotsResponse {
  timezone: string;
  type: AppointmentTypeOption;
  days: PublicSlotDay[];
}

export interface BookedAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  reason: string | null;
  typeName: string;
  format: MeetingFormat;
  durationMinutes: number;
  studentName: string | null;
  guardianName: string | null;
  virtualMeetingName: string | null;
  homeVisitAddress: string | null;
}

export interface TeacherAppointmentsResponse {
  bookingSlug: string;
  timezone: string;
  appointments: BookedAppointment[];
}

export interface PublicBookInput {
  appointmentTypeId: string;
  startsAt: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail?: string;
  guardianPhone?: string;
  studentFirstName: string;
  studentLastName: string;
  virtualMeetingName?: string;
  homeVisitAddress?: string;
  reason?: string;
}

export interface DashboardResponse {
  teacher: {
    firstName: string;
    lastName: string;
    timezone: string;
  };
  date: string;
  counts: DashboardCounts;
  todayAppointments: DashboardAppointment[];
  upcomingAppointments: DashboardAppointment[];
  contactQueue: DashboardContactTask[];
  recentActivity: DashboardActivity[];
}
