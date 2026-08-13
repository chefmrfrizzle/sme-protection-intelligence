"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpenText,
  Boxes,
  ClipboardCheck,
  Cog,
  FileOutput,
  Files,
  FlaskConical,
  History,
  LayoutDashboard,
  Menu,
  Presentation,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { brand } from "@/domain/brand";
import { useDemo } from "./demo-provider";
import { AccountControl } from "./account-control";
import { RehearsalDock } from "./rehearsal-dock";

const primaryNavigation = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/changes", label: "Changes", icon: Activity },
  { href: "/protection", label: "Protection", icon: ShieldCheck },
  { href: "/evidence", label: "Evidence", icon: Files },
  { href: "/review-case", label: "Review case", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: FileOutput },
] as const;

const secondaryNavigation = [
  { href: "/rehearsal", label: "Demo rehearsal", icon: Presentation },
  { href: "/glossary", label: "Language guide", icon: BookOpenText },
  { href: "/controls", label: "Control centre", icon: Cog },
  { href: "/simulator", label: "Scenario simulator", icon: FlaskConical },
  { href: "/audit", label: "View audit trail", icon: History },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href:
    | (typeof primaryNavigation)[number]["href"]
    | (typeof secondaryNavigation)[number]["href"];
  label: string;
  icon: typeof LayoutDashboard;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/protection" && pathname.startsWith("/findings/"));
  return (
    <Link
      className={`nav-link ${active ? "active" : ""}`}
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { reset } = useDemo();
  return (
    <>
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          {brand.mark}
        </span>
        <div>
          <strong>{brand.wordmark}</strong>
          <span>Protection intelligence</span>
        </div>
      </div>
      <div className="synthetic-pill">
        <Boxes aria-hidden="true" size={14} /> Synthetic demonstration
      </div>
      <nav className="primary-nav" aria-label="Primary navigation">
        {primaryNavigation.map((item) => (
          <NavLink key={item.href} {...item} onClick={onNavigate} />
        ))}
      </nav>
      <nav className="secondary-nav" aria-label="Secondary navigation">
        {secondaryNavigation.map((item) => (
          <NavLink key={item.href} {...item} onClick={onNavigate} />
        ))}
      </nav>
      <div className="sidebar-foot">
        <AccountControl />
        <div className="mode-row">
          <span className="mode-dot" /> Replay mode
        </div>
        <button className="text-button" type="button" onClick={reset}>
          <RotateCcw aria-hidden="true" size={15} /> Reset demo
        </button>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Sidebar />
      </aside>
      <header className="mobile-header">
        <div className="brand-lockup compact">
          <span className="brand-mark" aria-hidden="true">
            {brand.mark}
          </span>
          <strong>{brand.wordmark}</strong>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu aria-hidden="true" size={22} />
        </button>
      </header>
      {mobileOpen ? (
        <div
          className="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div
            className="drawer-backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="drawer-panel">
            <button
              className="icon-button drawer-close"
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              <X aria-hidden="true" size={21} />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}
      <main className="main-content">{children}</main>
      <RehearsalDock />
    </div>
  );
}
