import { DashboardPlaceholder } from "@/components/custom/dashboard-placeholder";

export default async function SharedPage() {
  return (
    <DashboardPlaceholder
      eyebrow="Shared"
      title="Boards shared with you."
      description="Collaborative boards from your workspace will appear here."
      actionLabel="Invite a collaborator"
    />
  );
}
