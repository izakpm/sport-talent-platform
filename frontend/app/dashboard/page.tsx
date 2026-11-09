'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardRoleConfig, normalizeDashboardRole } from './core/roles';

export default function DashboardEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.replace('/dashboard/athlete');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      const role = normalizeDashboardRole(parsed?.role);
      const roleConfig = getDashboardRoleConfig(role);
      router.replace(roleConfig.dashboardPath);
    } catch {
      router.replace('/dashboard/athlete');
    }
  }, [router]);

  return null;
}
