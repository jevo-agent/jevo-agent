import Image from "next/image";
import Link from "next/link";
import type { AgentRuntime } from "@/types/agent";

interface LandingFooterProps {
  agent?: AgentRuntime | null;
}

export function LandingFooter({ agent }: LandingFooterProps) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div>
          <Link className="brand" href="/">
            <Image
              src="/logo.png"
              alt=""
              width={22}
              height={22}
              className="brand-mark"
            />
            <span className="brand-name">JEVO</span>
            <span className="hidden brand-sub">/ Powered by Jev</span>
          </Link>
          <p className="label footer-phase">
            {agent?.networkLabel ?? "UNAVAILABLE"} / phase 0 / simulated state
          </p>
        </div>
        <nav className="foot-links" aria-label="Footer">
          <Link href="/jev">Jev</Link>
          <Link href="/app">App</Link>
          <Link href="/pairing">Pairings</Link>
          <Link href="/memory">Memory</Link>
          <Link href="/contracts">Contracts</Link>
          <Link href="/#pipeline">Architecture</Link>
        </nav>
        <div className="foot-note">
          <span className="label">
            JEVO is an independent protocol and is not affiliated with,
            sponsored by, or endorsed by Robinhood.
          </span>
          <span className="label">Not financial advice</span>
        </div>
      </div>
    </footer>
  );
}
