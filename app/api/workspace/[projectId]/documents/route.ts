import { desc, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getOwnedBoard } from "@/lib/documents/access";
import { isRecord, parseDocumentTitle } from "@/lib/documents/validation";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    return Response.json(
      { error: "Your account does not have a primary email address." },
      { status: 400 },
    );
  }

  const { projectId } = await context.params;

  try {
    if (!(await getOwnedBoard(projectId, userEmail))) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const documentRows = await db
      .select({
        id: documents.id,
        title: documents.title,
        position: documents.position,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(eq(documents.projectId, projectId))
      .orderBy(documents.position, desc(documents.updatedAt));

    return Response.json({ documents: documentRows });
  } catch (error) {
    console.error("Failed to load documents.", error);
    return Response.json(
      { error: "Unable to load documents right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    return Response.json(
      { error: "Your account does not have a primary email address." },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsedBody: unknown = await request.json();
    if (!isRecord(parsedBody)) {
      throw new Error("Expected an object.");
    }
    body = parsedBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title =
    body.title === undefined ? "Untitled document" : parseDocumentTitle(body.title);
  if (!title) {
    return Response.json(
      { error: "A document title between 1 and 160 characters is required." },
      { status: 400 },
    );
  }

  const { projectId } = await context.params;

  try {
    if (!(await getOwnedBoard(projectId, userEmail))) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const [existingDocument] = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))
      .orderBy(documents.position)
      .limit(1);

    if (existingDocument) {
      return Response.json({ document: existingDocument });
    }

    const [document] = await db
      .insert(documents)
      .values({
        projectId,
        title,
        content: { type: "markdown", markdown: "" },
        position: 0,
      })
      .returning();

    return Response.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Failed to create document.", error);
    return Response.json(
      { error: "Unable to create the document right now." },
      { status: 500 },
    );
  }
}
