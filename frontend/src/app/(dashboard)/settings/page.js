'use client';

import Link from 'next/link';
import { Users, Building, Shield, Bell, Key, Cog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import useAuthStore from '@/store/authStore';
import { USER_ROLES } from '@/lib/constants';

const SETTINGS_SECTIONS = [
    {
        title: 'System Settings',
        description: 'Configure company-wide settings, SLA defaults, and system policies.',
        icon: Cog,
        href: '/settings/system',
        roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
        title: 'User Management',
        description: 'Manage user accounts, roles, and access permissions.',
        icon: Users,
        href: '/users',
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
    },
    {
        title: 'Departments',
        description: 'Configure departments and team structures.',
        icon: Building,
        href: '/departments',
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN],
    },
    {
        title: 'Security',
        description: 'Password policies and login security settings.',
        icon: Shield,
        href: '/settings/security',
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.TEAM_MEMBER, USER_ROLES.NORMAL_USER],
    },
    {
        title: 'Notifications',
        description: 'Configure email and system notifications.',
        icon: Bell,
        href: '/settings/notifications',
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.TEAM_MEMBER, USER_ROLES.NORMAL_USER],
    },
    {
        title: 'Roles & Permissions',
        description: 'Define roles and granular permissions.',
        icon: Key,
        href: '/settings/roles',
        roles: [USER_ROLES.SUPER_ADMIN],
    }
];

export default function SettingsPage() {
    const { user } = useAuthStore();

    const filteredSections = SETTINGS_SECTIONS.filter(
        (section) => user && section.roles.includes(user.role)
    );

    return (
        <div className="space-y-6">
            <PageHeader
                heading="Settings"
                text="Manage your application settings and preferences."
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Link key={section.href} href={section.href} prefetch={false}>
                            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardHeader>
                                    <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle>{section.title}</CardTitle>
                                    <CardDescription>{section.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
