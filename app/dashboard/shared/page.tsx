import { auth } from "@clerk/nextjs/server";
import { DashboardPlaceholder } from "@/components/custom/dashboard-placeholder";

export default async function SharedPage() {
  await auth.protect();

  return (
    <DashboardPlaceholder
      eyebrow="Shared"
      title="Boards shared with you."
      description="Collaborative boards from your workspace will appear here."
      actionLabel="Invite a collaborator"
    />
  );
}
