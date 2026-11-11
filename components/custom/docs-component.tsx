"use client";

import * as React from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/custom/markdown-editor";

type DocsComponentProps = {
  projectId: string;
  onSavingChange?: (isSaving: boolean) => void;
};

export type DocsComponentHandle = {
  save: () => Promise<boolean>;
  hasUnsyncedChanges: () => boolean;
  discard: () => void;
};

type WorkspaceDocument = {
  id: number;
  title: string;
  content: unknown;
  updatedAt: string;
};

type SaveState = "saved" | "unsaved" | "saving" | "error";

function getMarkdown(content: unknown) {
  if (
    typeof content === "object" &&
    content !== null &&
    (content as { type?: unknown }).type === "markdown" &&
    typeof (content as { markdown?: unknown }).markdown === "string"
  ) {
    return (content as { markdown: string }).markdown;
  }

  return "";
}

function documentsMatch(
  left: WorkspaceDocument,
  right: WorkspaceDocument | null,
) {
  return Boolean(
    right &&
      left.id === right.id &&
      left.title === right.title &&
      JSON.stringify(left.content) === JSON.stringify(right.content),
  );
}

export const DocsComponent = React.forwardRef<DocsComponentHandle, DocsComponentProps>(
  function DocsComponent({ projectId, onSavingChange }, ref) {
    const [document, setDocument] = React.useState<WorkspaceDocument | null>(null);
    const [loadState, setLoadState] = React.useState<"loading" | "ready" | "error">("loading");
    const [saveState, setSaveState] = React.useState<SaveState>("saved");
    const documentRef = React.useRef<WorkspaceDocument | null>(null);
    const savedDocumentRef = React.useRef<WorkspaceDocument | null>(null);
    const isDirtyRef = React.useRef(false);
    const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const saveDocument = React.useCallback(async (draft: WorkspaceDocument) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (!draft.title.trim()) {
        setSaveState("error");
        return false;
      }

      setSaveState("saving");
      try {
        const response = await fetch(`/api/workspace/${projectId}/documents/${draft.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draft.title, content: draft.content }),
        });
        if (!response.ok) throw new Error(`Document save request failed with ${response.status}`);

        const data = (await response.json()) as { document: WorkspaceDocument };
        const currentDocument = documentRef.current;
        if (currentDocument && documentsMatch(currentDocument, draft)) {
          documentRef.current = data.document;
          savedDocumentRef.current = data.document;
          isDirtyRef.current = false;
          setDocument(data.document);
          setSaveState("saved");
        } else {
          setSaveState("unsaved");
          return false;
        }
        return true;
      } catch (error) {
        console.error("Unable to save workspace document.", error);
        setSaveState("error");
        return false;
      }
    }, [projectId]);

    const loadDocument = React.useCallback(async () => {
      setLoadState("loading");
      try {
        const listResponse = await fetch(`/api/workspace/${projectId}/documents`, { cache: "no-store" });
        if (!listResponse.ok) throw new Error(`Document list request failed with ${listResponse.status}`);
        const list = (await listResponse.json()) as { documents: Array<{ id: number }> };
        let documentId = list.documents[0]?.id;

        if (!documentId) {
          const createResponse = await fetch(`/api/workspace/${projectId}/documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Project notes" }),
          });
          if (!createResponse.ok) throw new Error(`Document create request failed with ${createResponse.status}`);
          const created = (await createResponse.json()) as { document: WorkspaceDocument };
          documentId = created.document.id;
        }

        const response = await fetch(`/api/workspace/${projectId}/documents/${documentId}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Document request failed with ${response.status}`);
        const data = (await response.json()) as { document: WorkspaceDocument };
        documentRef.current = data.document;
        savedDocumentRef.current = data.document;
        isDirtyRef.current = false;
        setDocument(data.document);
        setSaveState("saved");
        setLoadState("ready");
      } catch (error) {
        console.error("Unable to load workspace document.", error);
        setLoadState("error");
      }
    }, [projectId]);

    React.useEffect(() => { void loadDocument(); }, [loadDocument]);

    React.useEffect(() => {
      onSavingChange?.(saveState === "saving");
    }, [onSavingChange, saveState]);

    React.useEffect(() => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    }, []);

    const updateDraft = React.useCallback((updates: Partial<Pick<WorkspaceDocument, "title" | "content">>) => {
      setDocument((currentDocument) => {
        if (!currentDocument) return currentDocument;
        const draft = { ...currentDocument, ...updates };
        documentRef.current = draft;
        isDirtyRef.current = !documentsMatch(draft, savedDocumentRef.current);
        setSaveState(isDirtyRef.current ? "unsaved" : "saved");
        return draft;
      });
    }, []);

    React.useEffect(() => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (!document || !isDirtyRef.current) return;
      const snapshot = { ...document };
      saveTimerRef.current = setTimeout(() => void saveDocument(snapshot), 60_000);
    }, [document, saveDocument]);

    React.useImperativeHandle(ref, () => ({
      save: async () => documentRef.current && isDirtyRef.current ? saveDocument(documentRef.current) : true,
      hasUnsyncedChanges: () => isDirtyRef.current,
      discard: () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        const saved = savedDocumentRef.current;
        if (saved) {
          documentRef.current = saved;
          setDocument(saved);
        }
        isDirtyRef.current = false;
        setSaveState("saved");
      },
    }), [saveDocument]);

    if (loadState === "loading") {
      return <section className="grid min-h-0 flex-1 place-items-center bg-[#fffaf5] dark:bg-background"><LoaderCircle className="size-5 animate-spin text-[#ec6338]" aria-label="Loading document" /></section>;
    }

    if (loadState === "error" || !document) {
      return <section className="grid min-h-0 flex-1 place-items-center bg-[#fffaf5] p-6 text-center dark:bg-background"><div><p className="font-medium">Couldn’t load your notes</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void loadDocument()}><RefreshCw aria-hidden="true" />Try again</Button></div></section>;
    }

    return <section className="min-h-0 flex-1 overflow-y-auto bg-[#fffaf5] dark:bg-background"><article className="mx-auto w-full max-w-5xl px-6 py-6 sm:px-10 sm:py-8"><MarkdownEditor markdown={getMarkdown(document.content)} isSaving={saveState === "saving"} onMarkdownChange={(markdown) => updateDraft({ content: { type: "markdown", markdown } })} /></article></section>;
  },
);
