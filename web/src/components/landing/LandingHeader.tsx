"use client";

import Image from "next/image";
import Link from "next/link";

interface LandingHeaderProps {
  currentSection?: "landing" | "jev" | string;
}

export function LandingHeader({ currentSection }: LandingHeaderProps) {
  const isJev = currentSection === "jev";

  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href="/" aria-label="JEVO home">
          <Image
            src="/logo.png"
            alt=""
            width={22}
            height={22}
            priority
            className="brand-mark"
          />
          <span className="brand-name">JEVO</span>
          <span className="brand-sub">/ Autonomous market system</span>
        </Link>
        <nav className="nav" aria-label="Sections">
          <Link
            href="/jev"
            aria-current={isJev ? "page" : undefined}
            className={isJev ? "is-active" : undefined}
          >
            JEV
          </Link>
          <Link href="/#agent">Agent</Link>
          <Link href="/#market">Market</Link>
          <Link href="/#pairings">Pairings</Link>
          <Link href="/#pipeline">Architecture</Link>
          <Link href="/#memory">Memory</Link>
          <Link href="/contracts">CONTRACTS</Link>
        </nav>
        <div className="header-actions">
          <span className="label">
            <span className="on">●</span> Jev <b>active</b>
          </span>
          <Link className="btn btn-primary btn-sm" href="/app">
            Open app
          </Link>
        </div>
      </div>
    </header>
  );
}
