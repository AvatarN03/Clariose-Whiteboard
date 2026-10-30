"use client";

import Link from "next/link";
import { ButtonGroup } from "@/components/ui/button-group";
import { useToastManager } from "@/components/ui/toast";
import { BrandLogo } from "@/components/custom/brand-logo";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export type WorkspaceTab = "whiteboard" | "docs";

type WorkspaceHeaderProps = {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onSave: () => Promise<boolean>;
  onRequestLeave: () => void;
  isSaving: boolean;
};

export function WorkspaceHeader({
  activeTab,
  onTabChange,
  onSave,
  onRequestLeave,
  isSaving,
}: WorkspaceHeaderProps) {
  const toastManager = useToastManager();

  function showToast() {
    toastManager.add({
      title: "Share link ready",
      description: "Sharing is ready in this demo workspace.",
      type: "success",
    });
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 text-foreground sm:px-6">
      <Link
        href="/dashboard"
        className="shrink-0 cursor-pointer"
        aria-label="Go to dashboard"
        onClick={(event) => {
          event.preventDefault();
          onRequestLeave();
        }}
      >
        <BrandLogo nameClassName="text-lg" />
      </Link>

      <div className="absolute left-1/2 flex -translate-x-1/2 rounded-lg border border-border bg-muted p-1">
        {(["whiteboard", "docs"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={activeTab === tab}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <ButtonGroup className="shrink-0 gap-2">
        <ThemeToggle />
        <button
          type="button"
          disabled={isSaving}
          className="cursor-pointer rounded-lg bg-[#ec6338] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#d9562d]"
          onClick={async () => {
            const saved = await onSave();
            toastManager.add({
              title: saved ? "Workspace saved" : "Workspace not saved",
              description: saved
                ? "Your whiteboard was saved to the database."
                : "The whiteboard is still loading. Try saving again.",
              type: saved ? "success" : "error",
            });
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-[#1d1d1b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3b3a36]"
          onClick={showToast}
        >
          Share
        </button>
      </ButtonGroup>
    </header>
  );
}
