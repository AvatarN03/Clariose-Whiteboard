"use client";

import * as React from "react";
import { Copy, Share2 } from "lucide-react";
import { useToastManager } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ShareBoardDialog({ projectId }: { projectId: string }) {
  const toastManager = useToastManager();
  const [permission, setPermission] = React.useState<"viewer" | "editor">("viewer");
  const [email, setEmail] = React.useState("");
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  async function createShare() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspace/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission, email }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Unable to create a share link.");
      }
      setShareUrl(data.url);
    } catch (error) {
      console.error("Unable to create a board share link.", error);
      toastManager.add({
        title: "Share link unavailable",
        description: "Try again in a moment.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toastManager.add({
      title: "Share link copied",
      description: `${email} can open this board with their account.`,
      type: "success",
    });
  }

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) setShareUrl(null);
    }}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-[#1d1d1b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3b3a36]"
          />
        }
      >
        <Share2 className="mr-1.5 inline size-3.5" aria-hidden="true" />
        Share
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this board</DialogTitle>
          <DialogDescription>
            Invite one specific account. The recipient must sign in with this email.
          </DialogDescription>
        </DialogHeader>
        <label className="grid gap-2 text-sm font-medium">
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="collaborator@example.com"
            className="rounded-md border border-border bg-background px-3 py-2 font-normal"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Permission
          <select
            value={permission}
            onChange={(event) => setPermission(event.target.value as "viewer" | "editor")}
            className="rounded-md border border-border bg-background px-3 py-2 font-normal"
          >
            <option value="viewer">Can view</option>
            <option value="editor">Can edit</option>
          </select>
        </label>
        {shareUrl ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
            <span className="min-w-0 flex-1 truncate text-xs">{shareUrl}</span>
            <Button type="button" size="sm" onClick={copyShareUrl}>
              <Copy className="size-3.5" aria-hidden="true" />
              Copy
            </Button>
          </div>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Close
          </DialogClose>
          <Button type="button" disabled={isLoading} onClick={createShare}>
            {isLoading ? "Creating..." : shareUrl ? "Create another link" : "Create link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
