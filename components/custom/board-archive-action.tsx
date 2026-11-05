"use client";

import * as React from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToastManager } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BoardArchiveActionProps = {
  projectId: string;
  archived: boolean;
};

export function BoardArchiveAction({ projectId, archived }: BoardArchiveActionProps) {
  const router = useRouter();
  const toastManager = useToastManager();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const label = archived ? "Restore board" : "Archive board";

  async function handleClick() {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !archived }),
      });

      if (!response.ok) {
        throw new Error("Unable to update board");
      }

      toastManager.add({
        title: archived ? "Board restored" : "Board archived",
        description: archived
          ? "The board is back in your dashboard."
          : "You can restore it from Archive at any time.",
        type: "success",
      });
      router.refresh();
    } catch {
      toastManager.add({
        title: `Could not ${archived ? "restore" : "archive"} board`,
        description: "Please try again.",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            title={label}
            disabled={isUpdating}
            onClick={handleClick}
            className="border border-border/70 p-1.5 text-muted-foreground hover:-translate-y-px hover:border-border hover:bg-muted hover:text-foreground hover:shadow-sm"
          >
            {archived ? (
              <ArchiveRestore className="size-4" aria-hidden="true" />
            ) : (
              <Archive className="size-4" aria-hidden="true" />
            )}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
