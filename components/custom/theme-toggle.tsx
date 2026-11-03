"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "cn";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps = {}) {
  const { theme, setTheme } = useTheme();

  // React 19-safe client hydration guard without useEffect or setState in effect
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        disabled
        className={cn(
          "grid size-8 place-items-center rounded-lg border border-border bg-background text-foreground opacity-70 transition-colors",
          className
        )}
      >
        <span className="size-4" aria-hidden="true" />
      </button>
    );
  }

  const currentTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";

  const nextThemeMap: Record<"light" | "dark" | "system", "light" | "dark" | "system"> = {
    light: "dark",
    dark: "system",
    system: "light",
  };
  const nextTheme = nextThemeMap[currentTheme];

  const cycleTheme = () => {
    setTheme(nextTheme);
  };

  const label = `Current theme: ${currentTheme}. Switch to ${nextTheme} theme`;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={cycleTheme}
    >
      {currentTheme === "light" && <Sun className="size-4" aria-hidden="true" />}
      {currentTheme === "dark" && <Moon className="size-4" aria-hidden="true" />}
      {currentTheme === "system" && <Monitor className="size-4" aria-hidden="true" />}
    </button>
  );
}
