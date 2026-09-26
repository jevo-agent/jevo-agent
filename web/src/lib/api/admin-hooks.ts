/**
 * TanStack Query useMutation hooks for all admin write actions.
 *
 * All requests go through /api/admin/* (Next.js server routes) which attach
 * the ADMIN_API_TOKENS Bearer token server-side. The token is NEVER exposed
 * to the browser.
 *
 * On success each mutation invalidates the relevant query key(s) so the UI
 * updates automatically.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Shared fetch helper ──────────────────────────────────────────────────────

async function adminPost(path: string, body?: Record<string, unknown>) {
  const res = await fetch(`/api/admin${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Parse error message from response if possible
    let msg = `Request failed with status ${res.status}`;
    try {
      const json = await res.json();
      if (json?.message) msg = json.message;
      else if (json?.error) msg = json.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(msg);
  }

  return res.json();
}

// ─── Scan ─────────────────────────────────────────────────────────────────────

export function useTriggerScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: "DELTA" | "RANKING" | "FULL" | "NARRATIVE") =>
      adminPost("/scan/trigger", { kind }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agent-status"] });
    },
  });
}

// ─── Agent pause / resume ─────────────────────────────────────────────────────

export function usePauseAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminPost("/agent/pause"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agent-status"] });
    },
  });
}

export function useResumeAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminPost("/agent/resume"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agent-status"] });
    },
  });
}

// ─── Pairing actions ──────────────────────────────────────────────────────────

export function useApprovePairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminPost(`/pairings/${encodeURIComponent(id)}/approve`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pairings"] });
    },
  });
}

export function useRejectPairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminPost(`/pairings/${encodeURIComponent(id)}/reject`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pairings"] });
    },
  });
}

export function useEditPairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { memeSymbol?: string; thesis?: Record<string, string> };
    }) => adminPost(`/pairings/${encodeURIComponent(id)}/edit`, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ["pairings"] });
      void qc.invalidateQueries({ queryKey: ["pairing", id] });
    },
  });
}

// ─── Launch actions ───────────────────────────────────────────────────────────

export function useScheduleLaunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pairingCandidateId: string) =>
      adminPost("/launches/schedule", { pairingCandidateId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["launches"] });
      void qc.invalidateQueries({ queryKey: ["pairings"] });
    },
  });
}

export function useEmergencyPauseLaunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminPost(`/launches/${encodeURIComponent(id)}/emergency-pause`),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ["launches"] });
      void qc.invalidateQueries({ queryKey: ["launch", id] });
    },
  });
}

// ─── Config ───────────────────────────────────────────────────────────────────

export function useUpdateWeights() {
  return useMutation({
    mutationFn: (weights: Record<string, number>) =>
      adminPost("/config/weights", weights),
  });
}
