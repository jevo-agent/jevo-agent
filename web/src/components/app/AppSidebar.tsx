"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AgentRuntime } from "@/types/agent";

interface AppSidebarProps { agent: AgentRuntime; }

const items = [
  { href: "/app", label: "Overview", icon: "overview" },
  { href: "/pairing", label: "Pairings", icon: "pairing" },
  { href: "/launch", label: "Launch", icon: "launch" },
  { href: "/memory", label: "Memory", icon: "memory" },
] as const;

function NavIcon({ name }: { name: (typeof items)[number]["icon"] }) {
  if (name === "pairing") return <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="4.5" cy="8" r="3" /><circle cx="11.5" cy="4.5" r="2.2" /><circle cx="11.5" cy="11.5" r="2.2" /><path d="M7 6.8 9.6 5.2M7 9.2l2.6 1.6" /></svg>;
  if (name === "launch") return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5c2.2 1.6 3 3.7 3 6 0 1.6-.5 3-1 4l-2 2.5-2-2.5c-.5-1-1-2.4-1-4 0-2.3.8-4.4 3-6Z" /><circle cx="8" cy="7" r="1.3" /><path d="M5.5 12 3 14.5M10.5 12 13 14.5" /></svg>;
  if (name === "memory") return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5" /><path d="M8 4.5V8l2.8 1.6M8 1.5v2.2M1.8 8H4" /></svg>;
  return <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="6" height="6" /><rect x="8.5" y="1.5" width="6" height="9" /><rect x="1.5" y="9.5" width="6" height="5" /></svg>;
}

export function AppSidebar({ agent }: AppSidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <aside className="ref-sidebar">
      <Link href="/" className="ref-sidebar-brand" aria-label="JEVO public landing"><Image src="/logo.png" alt="" width={22} height={22} priority className="ref-logo" /><span>JEVO</span></Link>
      <nav className="side-nav" aria-label="App navigation">
        {items.map((item) => <Link key={item.href} href={item.href} className={isActive(item.href) ? "is-active" : undefined} aria-current={isActive(item.href) ? "page" : undefined}><NavIcon name={item.icon} /><span>{item.label}</span></Link>)}
      </nav>
      <div className="ref-sidebar-bottom"><Link href="/admin" className="side-admin"><span>Admin console</span><span className="tag">Restricted</span></Link><div className="side-net"><span className="label">Network</span><div className="row"><span className="label">Robinhood Chain</span><span className="label on">● Mainnet</span></div><div className="row"><span className="label">Chain ID</span><span className="label"><b>4663</b></span></div><div className="row"><span className="label">Phase</span><span className="label"><b>0</b> / simulated</span></div></div><span className="sr-only">{agent.networkLabel} / cycle {agent.activeCycle}</span></div>
    </aside>
  );
}
