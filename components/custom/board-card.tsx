import Link from "next/link";
import { ArrowUpRight, PanelsTopLeft } from "lucide-react";
import { BoardPreview } from "@/components/custom/board-preview";
import { BoardArchiveAction } from "@/components/custom/board-archive-action";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type DashboardBoard = {
  id: number;
  projectId: string;
  projectName: string;
  createdAt: string;
  archivedAt: string | null;
  elements: unknown;
  appState: unknown;
  files: unknown;
};

type BoardCardProps = {
  board: DashboardBoard;
  archived?: boolean;
};

export function BoardCard({ board, archived = false }: BoardCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-[#ec6338] hover:shadow-lg">
      <Link href={`/workspace/${board.projectId}`} className="block">
        <div className="h-52 border-b border-border">
          <BoardPreview
            elements={board.elements}
            appState={board.appState}
            files={board.files}
          />
        </div>
      </Link>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <Link href={`/workspace/${board.projectId}`} className="block">
            <div className="flex items-center gap-2">
              <PanelsTopLeft size={16} className="shrink-0 text-[#ec6338]" />
              <h2 className="truncate font-semibold">{board.projectName}</h2>
            </div>
          </Link>
          <p className="mt-2 text-xs text-[#756f65] dark:text-muted-foreground">
            {archived ? "Archived " : "Created "}
            {new Intl.DateTimeFormat("en", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(archived ? board.archivedAt ?? board.createdAt : board.createdAt))}
          </p>
        </div>
        <TooltipProvider>
          <div className="flex shrink-0 items-center gap-1">
            <BoardArchiveAction projectId={board.projectId} archived={archived} />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href={`/workspace/${board.projectId}`}
                    aria-label={`Open ${board.projectName}`}
                    title="Open board"
                    className="grid size-8 place-items-center rounded-md border border-border/70 p-1.5 text-[#9b9489] transition hover:-translate-y-px hover:border-border hover:bg-muted hover:text-[#ec6338] hover:shadow-sm"
                  >
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                }
              />
              <TooltipContent>Open board</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </article>
  );
}
