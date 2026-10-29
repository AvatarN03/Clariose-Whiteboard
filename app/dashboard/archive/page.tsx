import { auth } from "@clerk/nextjs/server";
import { DashboardPlaceholder } from "@/components/custom/dashboard-placeholder";

export default async function ArchivePage() {
  await auth.protect();

  return (
    <DashboardPlaceholder
      eyebrow="Archive"
      title="A quiet place for old boards."
      description="Archived boards will stay here until you are ready to bring them back."
      actionLabel="No archived boards yet"
    />
  );
}
