import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agente | Think clearly, together",
  description: "A shared whiteboard for turning ideas into useful next steps.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body>
        <ClerkProvider
          appearance={{ theme: shadcn }}
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
          dynamic
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
