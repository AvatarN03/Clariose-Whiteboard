import { and, eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getOwnedBoard } from "@/lib/documents/access";
import {
  isDocumentContent,
  isRecord,
  parseDocumentId,
  parseDocumentTitle,
} from "@/lib/documents/validation";

type RouteContext = {
  params: Promise<{ projectId: string; documentId: string }>;
};

async function getAuthorizedParams(context: RouteContext) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return null;
  }

  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const { projectId, documentId: documentIdParam } = await context.params;
  const documentId = parseDocumentId(documentIdParam);

  return { user, userEmail, projectId, documentId };
}

function documentWhere(projectId: string, documentId: number) {
  return and(eq(documents.projectId, projectId), eq(documents.id, documentId));
}

export async function GET(_request: Request, context: RouteContext) {
  const authorized = await getAuthorizedParams(context);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, userEmail, projectId, documentId } = authorized;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userEmail) {
    return Response.json(
      { error: "Your account does not have a primary email address." },
      { status: 400 },
    );
  }
  if (!documentId) {
    return Response.json({ error: "Invalid document ID." }, { status: 400 });
  }

  try {
    if (!(await getOwnedBoard(projectId, userEmail))) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const [document] = await db
      .select()
      .from(documents)
      .where(documentWhere(projectId, documentId))
      .limit(1);

    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    return Response.json({ document });
  } catch (error) {
    console.error("Failed to load document.", error);
    return Response.json(
      { error: "Unable to load the document right now." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authorized = await getAuthorizedParams(context);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, userEmail, projectId, documentId } = authorized;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userEmail) {
    return Response.json(
      { error: "Your account does not have a primary email address." },
      { status: 400 },
    );
  }
  if (!documentId) {
    return Response.json({ error: "Invalid document ID." }, { status: 400 });
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

  const updates: {
    title?: string;
    content?: unknown;
    position?: number;
    updatedAt: string;
  } = { updatedAt: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = parseDocumentTitle(body.title);
    if (!title) {
      return Response.json(
        { error: "A document title between 1 and 160 characters is required." },
        { status: 400 },
      );
    }
    updates.title = title;
  }

  if (body.content !== undefined) {
    if (!isDocumentContent(body.content)) {
      return Response.json(
        { error: "Document content must be valid Markdown or editor content under 1 MB." },
        { status: 400 },
      );
    }
    updates.content = body.content;
  }

  if (body.position !== undefined) {
    if (
      typeof body.position !== "number" ||
      !Number.isSafeInteger(body.position) ||
      body.position < 0
    ) {
      return Response.json(
        { error: "Document position must be a non-negative integer." },
        { status: 400 },
      );
    }
    updates.position = body.position;
  }

  if (Object.keys(updates).length === 1) {
    return Response.json(
      { error: "Provide a title, content, or position to update." },
      { status: 400 },
    );
  }

  try {
    if (!(await getOwnedBoard(projectId, userEmail))) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const [document] = await db
      .update(documents)
      .set(updates)
      .where(documentWhere(projectId, documentId))
      .returning();

    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    return Response.json({ document });
  } catch (error) {
    console.error("Failed to update document.", error);
    return Response.json(
      { error: "Unable to update the document right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authorized = await getAuthorizedParams(context);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, userEmail, projectId, documentId } = authorized;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userEmail) {
    return Response.json(
      { error: "Your account does not have a primary email address." },
      { status: 400 },
    );
  }
  if (!documentId) {
    return Response.json({ error: "Invalid document ID." }, { status: 400 });
  }

  try {
    if (!(await getOwnedBoard(projectId, userEmail))) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const [document] = await db
      .delete(documents)
      .where(documentWhere(projectId, documentId))
      .returning({ id: documents.id });

    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete document.", error);
    return Response.json(
      { error: "Unable to delete the document right now." },
      { status: 500 },
    );
  }
}
