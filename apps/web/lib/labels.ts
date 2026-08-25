import type {
  ContactMethod,
  ContactOutcome,
  ContactPriority,
  ContactReason,
  ContactStatus,
} from '@teacher-connect/types';

export const CONTACT_REASON_LABELS: Record<ContactReason, string> = {
  ACADEMIC_CONCERN: 'Academic concern',
  MISSING_ASSIGNMENTS: 'Missing assignments',
  ATTENDANCE: 'Attendance',
  BEHAVIOR: 'Behavior',
  POSITIVE_UPDATE: 'Positive update',
  STUDENT_IMPROVEMENT: 'Student improvement',
  GENERAL_QUESTION: 'General question',
  PARENT_REQUESTED: 'Parent requested contact',
  TEACHER_REQUESTED_CONFERENCE: 'Teacher requested conference',
  OTHER: 'Other',
};

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  NOT_CONTACTED: 'Not contacted',
  ATTEMPTED: 'Attempted',
  REACHED: 'Reached',
  FOLLOW_UP_REQUIRED: 'Follow-up needed',
  COMPLETED: 'Completed',
};

export const CONTACT_PRIORITY_LABELS: Record<ContactPriority, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  NORMAL: 'Normal',
  LOW: 'Low',
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  PHONE: 'Phone',
  EMAIL: 'Email',
  IN_PERSON: 'In person',
  VIDEO: 'Video',
  OTHER: 'Other',
};

export const CONTACT_OUTCOME_LABELS: Record<ContactOutcome, string> = {
  REACHED: 'Reached',
  NO_ANSWER: 'No answer',
  LEFT_VOICEMAIL: 'Left voicemail',
  EMAIL_SENT: 'Email sent',
  DECLINED: 'Declined',
  OTHER: 'Other',
};

export const CONTACT_REASONS = Object.keys(CONTACT_REASON_LABELS) as ContactReason[];
export const CONTACT_PRIORITIES = Object.keys(CONTACT_PRIORITY_LABELS) as ContactPriority[];
export const CONTACT_METHODS = Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[];
export const CONTACT_OUTCOMES = Object.keys(CONTACT_OUTCOME_LABELS) as ContactOutcome[];

export function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatDay(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}
