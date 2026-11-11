"use client";

import * as React from "react";
import {
  Bold,
  CodeXml,
  CircleHelp,
  Eye,
  FileText,
  Heading,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  LoaderCircle,
  Minus,
  PenLine,
  Quote,
  Strikethrough,
  Table2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MarkdownEditorProps = {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  isSaving: boolean;
};

const markdownReference = [
  { title: "Headings", description: "Use one to six # symbols.", syntax: "# Main heading\n## Section heading" },
  { title: "Emphasis", description: "Make text bold, italic, or crossed out.", syntax: "**bold**  *italic*  ~~deleted~~" },
  { title: "Links", description: "Add descriptive text and a destination URL.", syntax: "[Project website](https://example.com)" },
  { title: "Images", description: "Use alt text to describe the image.", syntax: "![Board sketch](https://example.com/image.png)" },
  { title: "Bulleted lists", description: "Start each item with a dash, star, or plus.", syntax: "- First item\n- Second item" },
  { title: "Numbered lists", description: "Start each item with a number and period.", syntax: "1. First item\n2. Second item" },
  { title: "Task lists", description: "Use [ ] for open tasks and [x] for completed tasks.", syntax: "- [ ] Draft proposal\n- [x] Review feedback" },
  { title: "Quotes", description: "Prefix quoted text with >.", syntax: "> A useful note" },
  { title: "Code", description: "Use backticks inline or three backticks for a block.", syntax: "`const value = 1`\n\n```js\nconst value = 1;\n```" },
  { title: "Tables", description: "Use pipes and a header divider.", syntax: "| Name | Status |\n| --- | --- |\n| Docs | Ready |" },
  { title: "Divider", description: "Separate sections with three dashes.", syntax: "---" },
];

function getMarkdownTemplate(title: string): [string, string, string] {
  const templates: Record<string, [string, string, string]> = {
    Headings: ["## ", "", "Heading"],
    Emphasis: ["**", "**", "bold text"],
    Links: ["[", "](https://example.com)", "Link text"],
    Images: ["![", "](https://example.com/image.png)", "Image description"],
    "Bulleted lists": ["- ", "", "List item"],
    "Numbered lists": ["1. ", "", "List item"],
    "Task lists": ["- [ ] ", "", "Task"],
    Quotes: ["> ", "", "Quote"],
    Code: ["\n```\n", "\n```\n", "code"],
    Tables: ["\n| Column | Column |\n| --- | --- |\n| ", " | value |\n", "value"],
    Divider: ["\n---\n", "", ""],
  };

  return templates[title];
}

export function MarkdownEditor({
  markdown,
  onMarkdownChange,
  isSaving,
}: MarkdownEditorProps) {
  const [mode, setMode] = React.useState<"write" | "preview">("write");
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = React.useCallback(
    (before: string, after: string, placeholder: string) => {
      const textarea = textareaRef.current;
      const selectionStart = textarea?.selectionStart ?? markdown.length;
      const selectionEnd = textarea?.selectionEnd ?? markdown.length;
      const selection = markdown.slice(selectionStart, selectionEnd);
      const content = selection || placeholder;
      const nextMarkdown = `${markdown.slice(0, selectionStart)}${before}${content}${after}${markdown.slice(selectionEnd)}`;

      onMarkdownChange(nextMarkdown);
      window.requestAnimationFrame(() => {
        textarea?.focus();
        textarea?.setSelectionRange(
          selectionStart + before.length,
          selectionStart + before.length + content.length,
        );
      });
    },
    [markdown, onMarkdownChange],
  );

  const prefixSelectedLines = React.useCallback(
    (getPrefix: (lineIndex: number) => string, placeholder: string) => {
      const textarea = textareaRef.current;
      const selectionStart = textarea?.selectionStart ?? markdown.length;
      const selectionEnd = textarea?.selectionEnd ?? markdown.length;
      const selection = markdown.slice(selectionStart, selectionEnd) || placeholder;
      const formattedSelection = selection
        .split("\n")
        .map((line, lineIndex) => `${getPrefix(lineIndex)}${line}`)
        .join("\n");
      const nextMarkdown = `${markdown.slice(0, selectionStart)}${formattedSelection}${markdown.slice(selectionEnd)}`;

      onMarkdownChange(nextMarkdown);
      window.requestAnimationFrame(() => {
        textarea?.focus();
        textarea?.setSelectionRange(selectionStart, selectionStart + formattedSelection.length);
      });
    },
    [markdown, onMarkdownChange],
  );

  const toolbarActions = [
    { label: "Heading", icon: Heading, onClick: () => insertMarkdown("## ", "", "Heading") },
    { label: "Bold", icon: Bold, onClick: () => insertMarkdown("**", "**", "bold text") },
    { label: "Italic", icon: Italic, onClick: () => insertMarkdown("*", "*", "italic text") },
    { label: "Strikethrough", icon: Strikethrough, onClick: () => insertMarkdown("~~", "~~", "crossed out text") },
    { label: "Inline code", icon: CodeXml, onClick: () => insertMarkdown("`", "`", "code") },
    { label: "Link", icon: Link, onClick: () => insertMarkdown("[", "](https://example.com)", "Link text") },
    { label: "Image", icon: Image, onClick: () => insertMarkdown("![", "](https://example.com/image.png)", "Image description") },
    { label: "Bulleted list", icon: List, onClick: () => prefixSelectedLines(() => "- ", "List item") },
    { label: "Numbered list", icon: ListOrdered, onClick: () => prefixSelectedLines((lineIndex) => `${lineIndex + 1}. `, "List item") },
    { label: "Task list", icon: ListTodo, onClick: () => prefixSelectedLines(() => "- [ ] ", "Task") },
    { label: "Quote", icon: Quote, onClick: () => prefixSelectedLines(() => "> ", "Quote") },
    { label: "Code block", icon: CodeXml, onClick: () => insertMarkdown("\n```\n", "\n```\n", "code") },
    { label: "Table", icon: Table2, onClick: () => insertMarkdown("\n| Column | Column |\n| --- | --- |\n| ", " | value |\n", "value") },
    { label: "Divider", icon: Minus, onClick: () => insertMarkdown("\n---\n", "", "") },
  ];

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={mode === "write"}
            disabled={isSaving}
            onClick={() => setMode("write")}
            className={mode === "write" ? "bg-[#ec6338] text-white hover:bg-[#d9562d] hover:text-white" : ""}
          >
            {isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <PenLine aria-hidden="true" />}
            {isSaving ? "Saving..." : "Write"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={mode === "preview"}
            onClick={() => setMode("preview")}
            className={mode === "preview" ? "bg-[#ec6338] text-white hover:bg-[#d9562d] hover:text-white" : ""}
          >
            <Eye aria-hidden="true" />
            Preview
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Markdown syntax help"
            title="Markdown syntax help"
            onClick={() => setIsHelpOpen(true)}
          >
            <CircleHelp aria-hidden="true" />
          </Button>
        </div>
      </div>
      {mode === "write" ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1.5" aria-label="Markdown formatting toolbar">
            {toolbarActions.map(({ label, icon: Icon, onClick }) => (
              <Button key={label} type="button" variant="ghost" size="icon-sm" disabled={isSaving} onClick={onClick} aria-label={label} title={label}>
                <Icon aria-hidden="true" />
              </Button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(event) => onMarkdownChange(event.target.value)}
            onKeyDown={(event) => {
              if (!(event.metaKey || event.ctrlKey) || event.shiftKey) return;
              const shortcuts = {
                b: () => insertMarkdown("**", "**", "bold text"),
                i: () => insertMarkdown("*", "*", "italic text"),
                k: () => insertMarkdown("[", "](https://example.com)", "Link text"),
              } as const;
              const action = shortcuts[event.key.toLowerCase() as keyof typeof shortcuts];
              if (!action) return;
              event.preventDefault();
              action();
            }}
            className="mt-3 min-h-96 w-full resize-y rounded-xl border border-border bg-card px-5 py-4 font-mono text-sm leading-7 outline-none placeholder:text-muted-foreground/70 focus:border-[#ec6338] focus:ring-3 focus:ring-[#ec6338]/15"
            aria-label="Markdown document content"
            placeholder={"# Project notes\n\nWrite with Markdown.\n\n- Decisions\n- Tasks\n- Useful links"}
            spellCheck
          />
        </>
      ) : (
        <MarkdownPreview markdown={markdown} />
      )}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="!flex !h-[calc(100dvh-1rem)] !w-[calc(100%-1rem)] !max-w-none !min-h-0 !flex-col !gap-0 !overflow-hidden !p-0 sm:!h-[min(44rem,calc(100dvh-2rem))] sm:!w-[calc(100%-2rem)] sm:!max-w-6xl">
          <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 sm:px-6 sm:py-5">
            <DialogTitle>Markdown quick reference</DialogTitle>
            <DialogDescription>
              Use these snippets in Write mode. Preview supports CommonMark and GitHub-Flavored Markdown.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {markdownReference.map(({ title, description, syntax }) => (
                <section key={title} className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-3">
                  <h3 className="font-medium">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                  <pre className="mt-3 min-w-0 flex-1 overflow-x-auto rounded-md bg-muted p-2.5 font-mono text-xs leading-5 whitespace-pre-wrap break-words"><code>{syntax}</code></pre>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="mt-3"
                    onClick={() => {
                      setMode("write");
                      setIsHelpOpen(false);
                      window.setTimeout(() => insertMarkdown(...getMarkdownTemplate(title)), 0);
                    }}
                  >
                    Insert
                  </Button>
                </section>
              ))}
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-xl">
            <Button type="button" variant="outline" onClick={() => setIsHelpOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  if (!markdown.trim()) {
    return (
      <div className="mt-5 grid min-h-96 place-items-center rounded-xl border border-dashed border-border bg-card/60 text-center text-sm text-muted-foreground">
        <div>
          <FileText className="mx-auto mb-3 size-5" aria-hidden="true" />
          Nothing to preview yet.
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-preview mt-5 min-h-96 overflow-x-auto rounded-xl border border-border bg-card px-4 py-5 text-sm leading-7 text-foreground sm:px-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      {false && markdown.split("\n").map((line, index) => {
        if (line.startsWith("### ")) return <h3 key={index} className="mt-5 text-lg font-semibold first:mt-0">{line.slice(4)}</h3>;
        if (line.startsWith("## ")) return <h2 key={index} className="mt-5 text-2xl font-semibold first:mt-0">{line.slice(3)}</h2>;
        if (line.startsWith("# ")) return <h1 key={index} className="mt-5 text-3xl font-semibold first:mt-0">{line.slice(2)}</h1>;
        if (/^[-*] /.test(line)) return <p key={index} className="pl-5 before:mr-2 before:content-['•']">{line.slice(2)}</p>;
        if (/^\d+\. /.test(line)) return <p key={index} className="pl-5">{line}</p>;
        if (line.startsWith("> ")) return <blockquote key={index} className="border-l-2 border-[#ec6338] pl-3 text-muted-foreground">{line.slice(2)}</blockquote>;
        if (!line) return <div key={index} className="h-4" aria-hidden="true" />;
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}
