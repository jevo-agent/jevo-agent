"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";
import { AppStatusStrip } from "@/components/app/AppStatusStrip";
import { AppTopbar } from "@/components/app/AppTopbar";
import type { AppData } from "@/components/app/types";

interface AppShellProps extends AppData {
  children: ReactNode;
  activeSection?: string;
  breadcrumb?: ReactNode;
}

export function AppShell({ children, activeSection, breadcrumb, ...data }: AppShellProps) {
  const statusAsset = data.featuredAsset ?? data.assets.find((asset) => asset.symbol === "NVDA") ?? data.assets[0];
  const statusPairing = data.pairings.find((pairing) => pairing.slug === data.launch.selectedPairingSlug) ?? data.featuredPairing;

  return (
    <div className="app-shell jevo-app">
      <AppSidebar agent={data.agent} activeSection={activeSection} />
      <div className="app-main-shell">
        <AppTopbar agent={data.agent} breadcrumb={breadcrumb} />
        <AppStatusStrip agent={data.agent} asset={statusAsset} pairing={statusPairing} />
        <main className="app-content" aria-live="polite">{children}</main>
      </div>
    </div>
  );
}
