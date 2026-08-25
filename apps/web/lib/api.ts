import type {
  AuthUser,
  BookedAppointment,
  ContactTaskDetail,
  ContactTaskSummary,
  CreateContactTaskInput,
  CreateStudentInput,
  DashboardResponse,
  HealthResponse,
  LoginResponse,
  PublicBookInput,
  PublicSlotsResponse,
  PublicTeacher,
  RecordContactInput,
  StudentSummary,
  TeacherAppointmentsResponse,
  TeacherSchedule,
} from '@teacher-connect/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function apiUrl(path: string) {
  if (typeof window === 'undefined') {
    return `${API_URL}${path}`;
  }

  return path;
}

export async function getApiHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(apiUrl('/api/health'), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Invalid email or password');
  }

  const data = (await response.json()) as LoginResponse;
  return data.user;
}

export async function logout() {
  await fetch(apiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(apiUrl('/api/auth/me'), {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthUser;
}

export async function getDashboard(): Promise<DashboardResponse | null> {
  const response = await fetch(apiUrl('/api/dashboard'), {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as DashboardResponse;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error('Request failed');
  }

  return (await response.json()) as T;
}

export async function listStudents() {
  const response = await fetch(apiUrl('/api/students'), {
    credentials: 'include',
    cache: 'no-store',
  });
  return readJson<StudentSummary[]>(response);
}

export async function createStudent(input: CreateStudentInput) {
  const response = await fetch(apiUrl('/api/students'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return readJson<StudentSummary>(response);
}

export async function listContactTasks() {
  const response = await fetch(apiUrl('/api/contacts'), {
    credentials: 'include',
    cache: 'no-store',
  });
  return readJson<ContactTaskSummary[]>(response);
}

export async function getContactTask(id: string) {
  const response = await fetch(apiUrl(`/api/contacts/${id}`), {
    credentials: 'include',
    cache: 'no-store',
  });
  return readJson<ContactTaskDetail>(response);
}

export async function createContactTask(input: CreateContactTaskInput) {
  const response = await fetch(apiUrl('/api/contacts'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return readJson<ContactTaskSummary>(response);
}

export async function recordContact(id: string, input: RecordContactInput) {
  const response = await fetch(apiUrl(`/api/contacts/${id}/logs`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return readJson<ContactTaskDetail>(response);
}

export async function getSchedule() {
  const response = await fetch(apiUrl('/api/scheduling'), {
    credentials: 'include',
    cache: 'no-store',
  });
  return readJson<TeacherSchedule>(response);
}

export async function saveAvailability(windows: TeacherSchedule['windows']) {
  const response = await fetch(apiUrl('/api/scheduling/availability'), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ windows }),
  });
  return readJson<TeacherSchedule>(response);
}

export async function listAppointments() {
  const response = await fetch(apiUrl('/api/appointments'), {
    credentials: 'include',
    cache: 'no-store',
  });
  return readJson<TeacherAppointmentsResponse>(response);
}

export async function cancelAppointment(id: string) {
  const response = await fetch(apiUrl(`/api/appointments/${id}/cancel`), {
    method: 'PATCH',
    credentials: 'include',
  });
  return readJson<{ id: string }>(response);
}

export async function getPublicTeacher(slug: string) {
  const response = await fetch(apiUrl(`/api/public/teachers/${slug}`), {
    cache: 'no-store',
  });
  return readJson<PublicTeacher>(response);
}

export async function getPublicSlots(slug: string, typeId: string) {
  const response = await fetch(
    apiUrl(`/api/public/teachers/${slug}/slots?typeId=${typeId}`),
    { cache: 'no-store' },
  );
  return readJson<PublicSlotsResponse>(response);
}

export async function startCalendarConnect() {
  const response = await fetch(apiUrl('/api/calendar/connect'), {
    credentials: 'include',
    cache: 'no-store',
  });
  return readJson<{ url: string }>(response);
}

export async function disconnectCalendar() {
  const response = await fetch(apiUrl('/api/calendar/connect'), {
    method: 'DELETE',
    credentials: 'include',
  });
  return readJson<{ ok: boolean }>(response);
}

export async function bookPublic(slug: string, input: PublicBookInput) {
  const response = await fetch(apiUrl(`/api/public/teachers/${slug}/book`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (response.status === 409) {
    throw new Error('That time was just booked. Please pick another slot.');
  }

  return readJson<BookedAppointment>(response);
}
