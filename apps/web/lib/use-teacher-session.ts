'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/api';
import type { AuthUser } from '@teacher-connect/types';

export function useTeacherSession() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getCurrentUser().then((current) => {
      if (!current) {
        router.replace('/login');
        return;
      }
      setUser(current);
      setLoading(false);
    });
  }, [router]);

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  const teacherName = user?.teacher
    ? `${user.teacher.firstName} ${user.teacher.lastName}`
    : user?.email ?? '';

  return { user, teacherName, loading, onLogout };
}
