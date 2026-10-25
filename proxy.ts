import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Authentication is enforced by the server resources in app/dashboard.
// This proxy remains required for Clerk's request handling in Next.js.
export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated } = await auth();

  if (isAuthenticated && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
