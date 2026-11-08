"use client";

import * as React from "react";
import { Eye, FileText, LoaderCircle, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type MarkdownEditorProps = {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  isSaving: boolean;
};

export function MarkdownEditor({
  markdown,
  onMarkdownChange,
  isSaving,
}: MarkdownEditorProps) {
  const [mode, setMode] = React.useState<"write" | "preview">("write");

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
        </div>
      </div>
      {mode === "write" ? (
        <textarea
          value={markdown}
          onChange={(event) => onMarkdownChange(event.target.value)}
          className="mt-5 min-h-96 w-full resize-y rounded-xl border border-border bg-card px-5 py-4 font-mono text-sm leading-7 outline-none placeholder:text-muted-foreground/70 focus:border-[#ec6338] focus:ring-3 focus:ring-[#ec6338]/15"
          aria-label="Markdown document content"
          placeholder={"# Project notes\n\nWrite with Markdown.\n\n- Decisions\n- Tasks\n- Useful links"}
          spellCheck
        />
      ) : (
        <MarkdownPreview markdown={markdown} />
      )}
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
    <div className="mt-5 min-h-96 rounded-xl border border-border bg-card px-5 py-4 text-sm leading-7 text-foreground">
      {markdown.split("\n").map((line, index) => {
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
