"use client";

import * as React from "react";
import Link from "next/link";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToastManager } from "@/components/ui/toast";
import { BrandLogo } from "@/components/custom/brand-logo";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { ShareBoardDialog } from "@/components/custom/share-board-dialog";
import {
  Ellipsis,
  FileText,
  RefreshCw,
  Save,
  SquarePen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  onRename?: (projectName: string) => Promise<boolean>;
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
  onRename,
}: WorkspaceHeaderProps) {
  const toastManager = useToastManager();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [draftName, setDraftName] = React.useState(projectName);
  const [isRenameSaving, setIsRenameSaving] = React.useState(false);
  const renameInputRef = React.useRef<HTMLInputElement>(null);
  const canRename = Boolean(onRename) && !isShared;

  React.useEffect(() => {
    if (!isRenaming && !isRenameDialogOpen) {
      setDraftName(projectName);
    }
  }, [isRenameDialogOpen, isRenaming, projectName]);

  const beginRename = (mobile = false) => {
    if (!canRename) return;
    setDraftName(projectName);
    if (mobile) {
      setIsRenameDialogOpen(true);
      return;
    }
    setIsRenaming(true);
    window.requestAnimationFrame(() => renameInputRef.current?.select());
  };

  const cancelRename = () => {
    setDraftName(projectName);
    setIsRenaming(false);
    setIsRenameDialogOpen(false);
  };

  const submitRename = async () => {
    const nextName = draftName.trim();
    if (!nextName || nextName === projectName) {
      cancelRename();
      return;
    }
    if (!onRename) return;

    setIsRenameSaving(true);
    const renamed = await onRename(nextName);
    setIsRenameSaving(false);
    if (renamed) {
      setIsRenaming(false);
      setIsRenameDialogOpen(false);
      toastManager.add({ title: "Board renamed", type: "success" });
    } else {
      toastManager.add({
        title: "Board not renamed",
        description: "Try a name between 1 and 120 characters.",
        type: "error",
      });
    }
  };

  const handleSave = async () => {
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
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 text-foreground sm:px-6">
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 cursor-pointer"
          aria-label="Go to dashboard"
          onClick={(event) => {
            event.preventDefault();
            onRequestLeave();
          }}
        >
          <BrandLogo mobileIconOnly nameClassName="text-lg" />
          <span className="text-sm text-muted-foreground" aria-hidden="true">/</span>
        </Link>
        {isRenaming ? (
          <form
            className="hidden min-w-0 md:block"
            onSubmit={(event) => {
              event.preventDefault();
              void submitRename();
            }}
          >
            <input
              ref={renameInputRef}
              value={draftName}
              maxLength={120}
              disabled={isRenameSaving}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelRename();
                }
              }}
              aria-label="Board name"
              className="h-8 w-44 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-[#ec6338] focus:ring-3 focus:ring-[#ec6338]/15"
            />
          </form>
        ) : (
          <button
            type="button"
            disabled={!canRename}
            onDoubleClick={() => beginRename()}
            onClick={() => {
              if (!window.matchMedia("(min-width: 768px)").matches) {
                beginRename(true);
              }
            }}
            title={canRename ? "Double-click to rename" : undefined}
            className="max-w-28 truncate text-left text-sm font-medium disabled:cursor-default sm:max-w-44 md:hover:text-[#ec6338]"
          >
            {projectName}
          </button>
        )}
      </div>

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
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          {!isShared ? <ShareBoardDialog projectId={projectId} /> : null}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
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
              {!isShared ? <ShareBoardDialog projectId={projectId} menuItem /> : null}
              <DropdownMenuItem
                disabled={isSaving}
                onClick={onRefresh}
                className="cursor-pointer"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Refresh
              </DropdownMenuItem>
              {canEdit ? (
                <DropdownMenuItem
                  disabled={isSaving}
                  onClick={() => void handleSave()}
                  className="!mt-1 !bg-[#ec6338] !font-medium !text-white hover:!bg-[#d9562d] focus:!bg-[#d9562d] focus:!text-white"
                >
                  <Save className="size-4" aria-hidden="true" />
                  {isSaving ? "Saving..." : "Save"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ButtonGroup>
      <Dialog
        open={isRenameDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isRenameSaving) cancelRename();
          else setIsRenameDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename board</DialogTitle>
            <DialogDescription>Choose a clear name for this workspace.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitRename();
            }}
          >
            <Input
              autoFocus
              value={draftName}
              maxLength={120}
              disabled={isRenameSaving}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelRename();
                }
              }}
              aria-label="Board name"
            />
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isRenameSaving} onClick={cancelRename}>Cancel</Button>
              <Button type="submit" disabled={isRenameSaving || !draftName.trim()}>
                {isRenameSaving ? "Saving..." : "Save name"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
