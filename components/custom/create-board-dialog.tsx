"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToastManager } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

type CreateBoardDialogProps = {
  trigger: React.ReactElement;
};

type CreateBoardResponse = {
  board?: {
    projectId: string;
  };
  error?: string;
};

async function createBoard(name: string): Promise<string> {
  const response = await fetch("/api/project", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectName: name }),
  });

  const result: CreateBoardResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Unable to create the project.");
  }

  if (!result.board?.projectId) {
    throw new Error("The project was created without an ID.");
  }

  return result.board.projectId;
}

export function CreateBoardDialog({ trigger }: CreateBoardDialogProps) {
  const router = useRouter();
  const toastManager = useToastManager();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setName("");
      setError("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter a board name.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const projectId = await createBoard(trimmedName);
      toastManager.add({
        title: "Board created",
        description: `"${trimmedName}" is ready to use.`,
        type: "success",
      });
      setOpen(false);
      setName("");
      router.push(`/workspace/${projectId}`);
    } catch {
      toastManager.add({
        title: "Could not create board",
        description: "Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a board</DialogTitle>
            <DialogDescription>
              Give your new whiteboard a name to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-2">
            <Label htmlFor="board-name">Board name</Label>
            <Input
              id="board-name"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Project kickoff"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "board-name-error" : undefined}
              autoFocus
            />
            {error ? (
              <p id="board-name-error" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
