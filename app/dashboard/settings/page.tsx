import { auth } from "@clerk/nextjs/server";
import { DashboardPlaceholder } from "@/components/custom/dashboard-placeholder";

export default async function SettingsPage() {
  await auth.protect();

  return (
    <DashboardPlaceholder
      eyebrow="Settings"
      title="Make the workspace yours."
      description="Workspace preferences, members, and integrations will be managed here."
      actionLabel="Workspace settings"
    />
  );
}
