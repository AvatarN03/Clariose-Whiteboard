import { auth } from "@clerk/nextjs/server";
import { DashboardPlaceholder } from "@/components/custom/dashboard-placeholder";

export default async function AiHelperPage() {
  await auth.protect();

  return (
    <DashboardPlaceholder
      eyebrow="AI helper"
      title="A thinking partner for your boards."
      description="Use AI to turn rough ideas into clear, useful board content."
      actionLabel="Start a conversation"
    />
  );
}
