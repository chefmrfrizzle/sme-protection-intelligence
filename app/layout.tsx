import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { DemoProvider } from "@/components/demo-provider";
import { RehearsalProvider } from "@/components/rehearsal-provider";
import { brand } from "@/domain/brand";

export const metadata: Metadata = {
  title: `${brand.wordmark} | SME Protection Intelligence`,
  description:
    "Synthetic demonstration of continuous exposure-to-protection reconciliation for growing SMEs.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <DemoProvider>
          <RehearsalProvider>
            <AppShell>{children}</AppShell>
          </RehearsalProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
