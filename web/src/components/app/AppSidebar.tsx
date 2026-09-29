"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { AgentRuntime } from "@/types/agent";
import { formatCycle } from "@/lib/format";
import { getDeploymentSummary } from "@/lib/deployments";

interface AppSidebarProps { agent: AgentRuntime; activeSection?: string; }

const sections = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "opportunities", label: "Opportunities", icon: "opportunity" },
  { id: "market-map", label: "Market Map", icon: "map" },
  { id: "decision-trace", label: "Decision Trace", icon: "trace" },
  { id: "pairings", label: "Pairings", icon: "pairing" },
  { id: "launch", label: "Launch", icon: "launch" },
  { id: "memory", label: "Memory", icon: "memory" },
  { id: "contracts", label: "Contracts", icon: "contracts" },
] as const;

function NavIcon({ name }: { name: (typeof sections)[number]["icon"] }) {
  if (name === "opportunity") return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 12.5 6.1 8l2.5 2.2L14 4.5" /><path d="M10.5 4.5H14V8" /></svg>;
  if (name === "map") return <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="4" cy="10.5" r="2" /><circle cx="11.8" cy="4" r="2" /><path d="m5.5 9 4.8-3.5M5.7 11.2l4.3 1.2" /></svg>;
  if (name === "trace") return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12M2 8h12M2 12.5h8" /><circle cx="12.5" cy="12.5" r="1.5" /></svg>;
  if (name === "pairing") return <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="4.5" cy="8" r="3" /><circle cx="11.5" cy="4.5" r="2.2" /><circle cx="11.5" cy="11.5" r="2.2" /><path d="M7 6.8 9.6 5.2M7 9.2l2.6 1.6" /></svg>;
  if (name === "launch") return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5c2.2 1.6 3 3.7 3 6 0 1.6-.5 3-1 4l-2 2.5-2-2.5c-.5-1-1-2.4-1-4 0-2.3.8-4.4 3-6Z" /><circle cx="8" cy="7" r="1.3" /><path d="M5.5 12 3 14.5M10.5 12 13 14.5" /></svg>;
  if (name === "memory") return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5" /><path d="M8 4.5V8l2.8 1.6M8 1.5v2.2M1.8 8H4" /></svg>;
  if (name === "contracts") return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5h10v11H3z" /><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" /></svg>;
  return <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="6" height="6" /><rect x="8.5" y="1.5" width="6" height="9" /><rect x="1.5" y="9.5" width="6" height="5" /></svg>;
}

export function AppSidebar({ agent, activeSection: activeSectionProp }: AppSidebarProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (activeSectionProp) return activeSectionProp;
    if (typeof window === "undefined") return "overview";
    if (pathname.startsWith("/stock/")) return "opportunities";
    if (pathname.startsWith("/pairing")) return "pairings";
    if (pathname.startsWith("/launch")) return "launch";
    if (pathname.startsWith("/memory")) return "memory";
    if (pathname.startsWith("/contracts")) return "contracts";
    const hash = window.location.hash.slice(1);
    return sections.some((section) => section.id === hash) ? hash : "overview";
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const appPage = pathname === "/app";

  const effectiveSection =
    activeSectionProp ||
    (pathname.startsWith("/stock/")
      ? "opportunities"
      : pathname.startsWith("/pairing")
      ? "pairings"
      : pathname.startsWith("/launch")
      ? "launch"
      : pathname.startsWith("/memory")
      ? "memory"
      : pathname.startsWith("/contracts")
      ? "contracts"
      : activeSection);

  useEffect(() => {
    if (!appPage) return;

    const updateActiveSection = () => {
      // 140px offset accounts for fixed topbar and status strip
      const topOffset = 140;
      let current: string = sections[0].id;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= topOffset) {
          current = section.id;
        }
      }
      setActiveSection((prev) => (prev !== current ? current : prev));
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateActiveSection();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [appPage]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const sectionHref = (id: string) => {
    if (id === "pairings") return "/pairing";
    if (id === "launch") return "/launch";
    if (id === "memory") return "/memory";
    if (id === "contracts") return "/contracts";
    return `/app#${id}`;
  };
  const linkClass = (id: string) => (effectiveSection === id ? "is-active" : undefined);
  const selectSection = (id: string) => {
    setActiveSection(id);
    setDrawerOpen(false);
  };
  const navLinks = sections.map((section) => (
    <Link
      key={section.id}
      href={sectionHref(section.id)}
      className={linkClass(section.id)}
      aria-current={linkClass(section.id) ? "location" : undefined}
      onClick={() => selectSection(section.id)}
    >
      <NavIcon name={section.icon} />
      <span>{section.label}</span>
    </Link>
  ));

  return (
    <>
      <aside className="ref-sidebar">
        <Link href="/" className="ref-sidebar-brand" aria-label="JEVO public landing">
          <Image src="/logo.png" alt="" width={22} height={22} priority className="ref-logo" />
          <span>JEVO</span>
        </Link>
        <nav className="side-nav" aria-label="App sections">
          {navLinks}
        </nav>
        <div className="ref-sidebar-bottom">
          <div className="side-net">
            <span className="label">Network context</span>
            <div className="row">
              <span className="label">Target</span>
              <span className="label"><b>Robinhood Chain · Phase 0</b></span>
            </div>
            <div className="row">
              <span className="label">Connection</span>
              <span className="label"><b>{agent.networkLabel ?? "UNAVAILABLE"}</b></span>
            </div>
            <div className="row">
              <span className="label">Chain ID</span>
              <span className="label"><b>—</b></span>
            </div>
            <div className="row">
              <span className="label">Contracts</span>
              <Link href="/contracts" className="side-net-link" aria-label="View registered contracts">
                <b>{getDeploymentSummary()}</b>&nbsp;↗
              </Link>
            </div>
          </div>
          <span className="sr-only">{agent.networkLabel ?? "UNAVAILABLE"} / cycle {formatCycle(agent.activeCycle)}</span>
        </div>
      </aside>

      <div className="app-mobile-nav">
        <button
          type="button"
          className="app-menu-button"
          aria-label="Open app navigation"
          aria-expanded={drawerOpen}
          aria-controls="app-mobile-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <Link href="/" className="app-mobile-brand">
          <Image src="/logo.png" alt="" width={20} height={20} />
          <b>JEVO</b>
        </Link>
        <span className="app-mobile-crumb">/ {sections.find((section) => section.id === effectiveSection)?.label ?? "Overview"}</span>
        <span className="app-mobile-status">
          <i /> JEV {agent.jevStatus}
        </span>
      </div>

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="app-drawer-backdrop"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          />
          <aside id="app-mobile-drawer" className="app-mobile-drawer" aria-label="Mobile app navigation">
            <div className="app-drawer-head">
              <span className="label">JEVO / SECTIONS</span>
              <button type="button" aria-label="Close app navigation" onClick={() => setDrawerOpen(false)}>
                ×
              </button>
            </div>
            <nav className="side-nav app-drawer-nav" aria-label="Mobile app sections">
              {navLinks}
            </nav>
          </aside>
        </>
      ) : null}
    </>
  );
}
