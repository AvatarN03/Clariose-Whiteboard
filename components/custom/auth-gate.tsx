"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const query = searchParams.toString();
      const returnUrl = query ? `${pathname}?${query}` : pathname;
      openSignIn({ forceRedirectUrl: returnUrl });
    }
  }, [isLoaded, isSignedIn, openSignIn, pathname, searchParams]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return children;
}
