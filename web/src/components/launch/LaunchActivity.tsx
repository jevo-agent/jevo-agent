"use client";

import { motion } from "framer-motion";

import { formatClock } from "@/lib/format";
import type { Launch } from "@/types/launch";

interface LaunchActivityProps { launch: Launch; }

export function LaunchActivity({ launch }: LaunchActivityProps) {
  return <section aria-labelledby="launch-activity-title" className="border-b border-[var(--jevo-line)]"><div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--jevo-line)] px-5 py-4 sm:px-6"><h2 id="launch-activity-title" className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">Launch activity</h2><p className="protocol-label">Observable events only</p></div><ol className="divide-y divide-[var(--jevo-line)]">{launch.activity.map((event, index) => <motion.li key={event.id} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.2, delay: index * 0.03 }} className="grid gap-3 px-5 py-5 sm:grid-cols-[8rem_minmax(0,1fr)_6rem] sm:px-6"><time dateTime={event.timestamp} className="font-mono text-[0.62rem] tracking-[0.07em] text-[var(--jevo-muted)]">{formatClock(event.timestamp)} UTC</time><p className="text-sm leading-6 text-[var(--jevo-muted)]">{event.summary}</p><span className="font-mono text-[0.58rem] tracking-[0.07em] text-[var(--jevo-text)] uppercase">{event.type}</span></motion.li>)}</ol></section>;
}
