"use client";

import { useEffect, type ReactNode } from "react";

export function LandingScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty("--landing-progress", `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    const onAnchorClick = (event: Event) => {
      const anchor = event.currentTarget as HTMLAnchorElement;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#" || !hash.startsWith("#")) return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      window.history.replaceState(null, "", hash);
    };
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    anchors.forEach((anchor) => anchor.addEventListener("click", onAnchorClick));
    return () => {
      anchors.forEach((anchor) => anchor.removeEventListener("click", onAnchorClick));
      window.removeEventListener("scroll", updateProgress);
      root.style.removeProperty("--landing-progress");
    };
  }, []);

  return <div className="landing-root">{children}</div>;
}
