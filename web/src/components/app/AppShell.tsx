"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";
import { AppStatusStrip } from "@/components/app/AppStatusStrip";
import { AppTopbar } from "@/components/app/AppTopbar";
import type { AppData } from "@/components/app/types";

export function AppShell({ children, ...data }: AppData & { children: ReactNode }) {
  const statusAsset = data.assets.find((asset) => asset.symbol === "NVDA") ?? data.featuredAsset;
  const statusPairing = data.pairings.find((pairing) => pairing.slug === data.launch.selectedPairingSlug) ?? data.featuredPairing;

  return (
    <div className="app-shell jevo-app">
      <AppSidebar agent={data.agent} />
      <div className="app-main-shell">
        <AppTopbar agent={data.agent} />
        <AppStatusStrip agent={data.agent} asset={statusAsset} pairing={statusPairing} />
        <main className="app-content" aria-live="polite">{children}</main>
      </div>
    </div>
  );
}
