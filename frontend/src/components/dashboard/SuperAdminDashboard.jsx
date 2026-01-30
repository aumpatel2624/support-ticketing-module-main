import {
    Users,
    Settings,
    Database,
    Activity
} from 'lucide-react';
import StatsCard from './StatsCard';
import AdminDashboard from './AdminDashboard';

export default function SuperAdminDashboard({ user }) {
    // Super Admin likely wants to see everything Admin sees, plus system health
    // For now, let's just reuse AdminDashboard but maybe with extra system stats
    // Or just separate it if it diverges.

    // Let's create a wrapper that adds system stats on top
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                    title="System Status"
                    value="Healthy"
                    icon={Activity}
                    className="bg-success/10"
                    description="All services operational"
                />
                <StatsCard
                    title="Total Users"
                    value="156"
                    icon={Users}
                    trend={{ value: 4, label: "new this week" }}
                    trendDirection="up"
                />
                <StatsCard
                    title="Storage Used"
                    value="45%"
                    icon={Database}
                    description="234 GB / 512 GB"
                />
                <StatsCard
                    title="Version"
                    value="v1.2.0"
                    icon={Settings}
                    description="Latest patch installed"
                />
            </div>

            {/* Reuse Admin Dashboard for operational metrics */}
            <AdminDashboard user={user} />
        </div>
    );
}
