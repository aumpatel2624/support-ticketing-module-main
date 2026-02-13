'use client';

import PageHeader from '@/components/common/PageHeader';
import ChangePasswordForm from '@/components/settings/ChangePasswordForm';

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        heading="Security Settings"
        text="Manage your account security and password."
      />

      <div className="max-w-2xl">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
