const MAX_DOCUMENT_TITLE_LENGTH = 160;
const MAX_DOCUMENT_CONTENT_BYTES = 1_000_000;

type RichTextContent = {
  type: "doc";
  content: unknown[];
};

type MarkdownContent = {
  type: "markdown";
  markdown: string;
};

export type DocumentContent = RichTextContent | MarkdownContent;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDocumentId(value: string): number | null {
  const documentId = Number(value);
  return Number.isSafeInteger(documentId) && documentId > 0 ? documentId : null;
}

export function parseDocumentTitle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const title = value.trim();
  return title.length > 0 && title.length <= MAX_DOCUMENT_TITLE_LENGTH
    ? title
    : null;
}

export function isDocumentContent(value: unknown): value is DocumentContent {
  if (!isRecord(value)) {
    return false;
  }

  const isRichText = value.type === "doc" && Array.isArray(value.content);
  const isMarkdown = value.type === "markdown" && typeof value.markdown === "string";
  if (!isRichText && !isMarkdown) return false;

  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength <= MAX_DOCUMENT_CONTENT_BYTES;
  } catch {
    return false;
  }
}
