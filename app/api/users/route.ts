import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ id: user.id, email: user.primaryEmailAddress?.emailAddress ?? null, firstName: user.firstName, lastName: user.lastName, imageUrl: user.imageUrl });
}