'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getDashboard, logout } from '@/lib/api';
import type { DashboardResponse } from '@teacher-connect/types';
import { DashboardView } from './dashboard-view';

export function DashboardHome() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const data = await getDashboard();
      if (!data) {
        setError('Could not load the dashboard. Is the API running?');
        setLoading(false);
        return;
      }

      setDashboard(data);
      setLoading(false);
    })();
  }, [router]);

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  if (loading) {
    return (
      <main className="page flex min-h-full items-center justify-center">
        <p className="text-[var(--muted)]">Loading today&apos;s work…</p>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="page flex min-h-full items-center justify-center px-6">
        <p className="text-[var(--muted)]">{error ?? 'Dashboard is unavailable.'}</p>
      </main>
    );
  }

  return <DashboardView dashboard={dashboard} onLogout={() => void onLogout()} />;
}
