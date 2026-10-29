import { currentUser } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { boards } from "@/db/schema";

type CreateProjectBody = {
  projectName?: unknown;
};

export async function POST(request: Request) {
  const user = await currentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateProjectBody;

  try {
    body = (await request.json()) as CreateProjectBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const projectName =
    typeof body.projectName === "string" ? body.projectName.trim() : "";
  const userEmail = user.primaryEmailAddress?.emailAddress;

  if (!projectName) {
    return Response.json(
      { error: "A project name is required." },
      { status: 400 },
    );
  }

  if (!userEmail) {
    return Response.json(
      { error: "Your account does not have a primary email address." },
      { status: 400 },
    );
  }

  try {
    const [board] = await db
      .insert(boards)
      .values({
        projectId: randomUUID(),
        projectName,
        userEmail,
      })
      .returning({
        id: boards.id,
        projectId: boards.projectId,
        projectName: boards.projectName,
        userEmail: boards.userEmail,
        createdAt: boards.createdAt,
      });

    return Response.json({ board }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project.", error);
    return Response.json(
      { error: "Unable to create the project right now." },
      { status: 500 },
    );
  }
}
