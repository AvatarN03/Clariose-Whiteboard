"use client";

import Link from "next/link";
import { ButtonGroup } from "@/components/ui/button-group";
import { useToastManager } from "@/components/ui/toast";
import { BrandLogo } from "@/components/custom/brand-logo";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { ShareBoardDialog } from "@/components/custom/share-board-dialog";
import {
  Ellipsis,
  FileText,
  RefreshCw,
  SquarePen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type WorkspaceTab = "whiteboard" | "docs";

const workspaceTabs = [
  { value: "whiteboard" as const, label: "Whiteboard", icon: SquarePen },
  { value: "docs" as const, label: "Docs", icon: FileText },
];

type WorkspaceHeaderProps = {
  projectName: string;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onSave: () => Promise<boolean>;
  onRefresh: () => void;
  onRequestLeave: () => void;
  isSaving: boolean;
  projectId: string;
  canEdit?: boolean;
  isShared?: boolean;
};

export function WorkspaceHeader({
  projectName,
  activeTab,
  onTabChange,
  onSave,
  onRefresh,
  onRequestLeave,
  isSaving,
  projectId,
  canEdit = true,
  isShared = false,
}: WorkspaceHeaderProps) {
  const toastManager = useToastManager();

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 text-foreground sm:px-6">
      <Link
        href="/dashboard"
        className="flex min-w-0 shrink-0 items-center gap-2 cursor-pointer"
        aria-label="Go to dashboard"
        onClick={(event) => {
          event.preventDefault();
          onRequestLeave();
        }}
      >
        <BrandLogo mobileIconOnly nameClassName="text-lg" />
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          /
        </span>
        <span className="max-w-28 truncate text-sm font-medium sm:max-w-44">
          {projectName}
        </span>
      </Link>

      <TooltipProvider>
        <div className="absolute left-1/2 flex -translate-x-1/2 rounded-lg border border-border bg-muted p-1">
          {workspaceTabs.map(({ value, label, icon: Icon }) => (
            <Tooltip key={value}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className={`cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors md:px-3 ${
                      activeTab === value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label={label}
                    aria-pressed={activeTab === value}
                    onClick={() => onTabChange(value)}
                  >
                    <Icon className="size-4 md:hidden" aria-hidden="true" />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                }
              />
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <ButtonGroup className="shrink-0 gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <button
            type="button"
            disabled={isSaving}
            aria-label="Refresh workspace"
            title="Refresh workspace"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onRefresh}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            disabled={isSaving}
            className="cursor-pointer rounded-lg bg-[#ec6338] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#d9562d]"
            onClick={async () => {
              const saved = await onSave();
              toastManager.add({
                title: saved
                  ? activeTab === "docs"
                    ? "Document saved"
                    : "Workspace saved"
                  : activeTab === "docs"
                    ? "Document not saved"
                    : "Workspace not saved",
                description: saved
                  ? activeTab === "docs"
                    ? "Your document was saved to the database."
                    : "Your whiteboard was saved to the database."
                  : activeTab === "docs"
                    ? "Keep editing, then try saving again."
                    : "The whiteboard is still loading. Try saving again.",
                type: saved ? "success" : "error",
              });
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          {!isShared ? <ShareBoardDialog projectId={projectId} /> : null}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {!isShared ? <ShareBoardDialog projectId={projectId} /> : null}
          {canEdit ? <button
            type="button"
            disabled={isSaving}
            className="cursor-pointer rounded-lg bg-[#ec6338] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#d9562d]"
            onClick={async () => {
              const saved = await onSave();
              toastManager.add({
                title: saved
                  ? activeTab === "docs"
                    ? "Document saved"
                    : "Workspace saved"
                  : activeTab === "docs"
                    ? "Document not saved"
                    : "Workspace not saved",
                description: saved
                  ? activeTab === "docs"
                    ? "Your document was saved to the database."
                    : "Your whiteboard was saved to the database."
                  : activeTab === "docs"
                    ? "Keep editing, then try saving again."
                    : "The whiteboard is still loading. Try saving again.",
                type: saved ? "success" : "error",
              });
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button> : null}
        </div>
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open workspace menu"
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-accent"
            >
              <Ellipsis className="size-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem
                disabled={isSaving}
                onClick={onRefresh}
                className="cursor-pointer"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ButtonGroup>
    </header>
  );
}
