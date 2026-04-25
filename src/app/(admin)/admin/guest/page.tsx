'use client';
import DashboardContent from '@/components/Admin/DashboardContent';

export default function GuestDashboardPage() {
  return <DashboardContent forcedRole="guest" />;
}
