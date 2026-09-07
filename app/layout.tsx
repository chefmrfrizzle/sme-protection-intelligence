import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { DemoProvider } from "@/components/demo-provider";
import { brand } from "@/domain/brand";

export const metadata: Metadata = {
  title: `${brand.wordmark} | ${brand.productName}`,
  description:
    "Synthetic, evidence-first Enterprise Risk Passport. Protection is the first implemented module.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <DemoProvider>
          <AppShell>{children}</AppShell>
        </DemoProvider>
      </body>
    </html>
  );
}
