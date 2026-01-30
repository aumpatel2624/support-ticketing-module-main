'use client';

import useAuthStore from '@/store/authStore';
import { USER_ROLES } from '@/lib/constants';
import NormalUserDashboard from '@/components/dashboard/NormalUserDashboard';
import TeamMemberDashboard from '@/components/dashboard/TeamMemberDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';

export default function DashboardPage() {
    const { user } = useAuthStore();

    if (!user) return null;

    // Render dashboard based on role
    switch (user.role) {
        case USER_ROLES.SUPER_ADMIN:
            return <SuperAdminDashboard user={user} />;
        case USER_ROLES.ADMIN:
            return <AdminDashboard user={user} />;
        case USER_ROLES.TEAM_MEMBER:
            return <TeamMemberDashboard user={user} />;
        case USER_ROLES.NORMAL_USER:
        default:
            return <NormalUserDashboard user={user} />;
    }
}
