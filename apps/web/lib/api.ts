import type { HealthResponse } from '@teacher-connect/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getApiHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
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
