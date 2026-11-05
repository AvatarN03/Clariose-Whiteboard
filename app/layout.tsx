import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/custom/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clariose | Think clearly, together",
  description: "A shared whiteboard for turning ideas into useful next steps.",
  icons: "/favicon.png",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          <ClerkProvider
            appearance={{ theme: shadcn }}
            signInForceRedirectUrl="/dashboard"
            signUpForceRedirectUrl="/dashboard"
            dynamic
          >
            <Toaster>{children}</Toaster>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
