"use client";

import Link from "next/link";
import * as React from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { useToastManager } from "@/components/ui/toast";

type WorkspaceTab = "whiteboard" | "docs";

export function WorkspaceHeader() {
  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>("whiteboard");
  const toastManager = useToastManager();

  function showDemoToast(action: "saved" | "shared") {
    toastManager.add({
      title: action === "saved" ? "Workspace saved" : "Share link ready",
      description:
        action === "saved"
          ? "Your whiteboard has been saved in this demo."
          : "Sharing is ready in this demo workspace.",
      type: "success",
    });
  }

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-[#ded9cf] bg-white px-4 sm:px-6">
      <Link
        href="/dashboard"
        className="shrink-0 cursor-pointer"
        aria-label="Go to dashboard"
      >
        <span className="font-board text-lg font-semibold">Agente</span>
      </Link>

      <div className="absolute left-1/2 flex -translate-x-1/2 rounded-lg border border-[#ded9cf] bg-[#f8f7f4] p-1">
        {(["whiteboard", "docs"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-white text-[#1d1d1b] shadow-sm"
                : "text-[#756f65] hover:text-[#1d1d1b]"
            }`}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <ButtonGroup className="shrink-0 gap-2">
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-[#ec6338] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#d9562d]"
          onClick={() => showDemoToast("saved")}
        >
          Save
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-[#1d1d1b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3b3a36]"
          onClick={() => showDemoToast("shared")}
        >
          Share
        </button>
      </ButtonGroup>
    </header>
  );
}
