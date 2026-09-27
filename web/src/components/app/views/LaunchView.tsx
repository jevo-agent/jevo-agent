"use client";

import Link from "next/link";

import { formatCountdown } from "@/lib/format";
import type { AgentRuntime } from "@/types/agent";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

interface LaunchViewProps {
  launch?: Launch | null;
  pairing?: Pairing | null;
  agent?: AgentRuntime;
}

const STANDBY_STAGES = [
  { id: "CANDIDATE_SELECTED", point: "T-24H", desc: "Opportunity and pair thesis locked for launch review." },
  { id: "NARRATIVE_VALIDATION", point: "T-18H", desc: "Narrative pressure and why-now context verified above launch threshold." },
  { id: "PAIRING_VALIDATION", point: "T-12H", desc: "Pairing score, metadata, Stock Token identity, and policy constraints validated." },
  { id: "CONTRACT_PREPARATION", point: "T-06H", desc: "Approved launch parameters assembled for Launch Executor and Pons adapter." },
  { id: "FINAL_POLICY_CHECK", point: "T-01H", desc: "Permissions, transaction simulation, launch limits, and guardian approval verified." },
  { id: "CONTROLLED_EXECUTION", point: "T-00", desc: "Approved action submitted through restricted Launch Executor." },
];

const STANDBY_POLICY_CHECKS = [
  { id: "policy-stock", label: "Valid Stock Token", desc: "Canonical asset identity verified on Robinhood Chain." },
  { id: "policy-pair", label: "Approved Pairing Asset", desc: "Pairing asset permitted by protocol policy boundaries." },
  { id: "policy-metadata", label: "Token Metadata", desc: "Token name, ticker symbol, and metadata payload valid." },
  { id: "policy-contract", label: "Contract Parameters", desc: "Launch parameters within Phase 0 permission boundaries." },
  { id: "policy-limits", label: "Launch Limits", desc: "Initial liquidity limits and volume thresholds respected." },
  { id: "policy-duplicate", label: "Duplicate Check", desc: "Collision verification; no duplicate active tokens." },
  { id: "policy-permission", label: "Agent Permission", desc: "Scoped executor permissions valid for approved action." },
  { id: "policy-simulation", label: "Transaction Simulation", desc: "Zero-revert preflight simulation verified." },
];

export function LaunchView({ launch, pairing, agent }: LaunchViewProps) {
  // When no active launch exists:
  if (!launch) {
    return (
      <section className="app-reference-view">
        <div className="page-head">
          <div>
            <h2>Autonomous launch</h2>
            <p>Autonomous does not mean unrestricted. A qualified pair moves through a policy-checked cycle before anything reaches Robinhood Chain.</p>
          </div>
          <span className="label">
            {agent ? `CYCLE ${agent.activeCycle} · ` : ""}Phase 0 / Standby · Operator gate active
          </span>
        </div>

        {/* 01. Visual Preview of the 6 Launch Stages (Dimmed / Standby) */}
        <ol className="lstages">
          {STANDBY_STAGES.map((stage) => (
            <li key={stage.id} className="lstage lstage--standby">
              <span className="st">Standby · {stage.point}</span>
              <h4>{stage.id.replaceAll("_", " ")}</h4>
              <p>{stage.desc}</p>
            </li>
          ))}
        </ol>

        {/* 02. Launch Grid in Standby */}
        <div className="launch-grid">
          <div>
            <p className="label">
              Next agent launch / <b>{pairing ? `${pairing.stockSymbol} × ${pairing.symbol} (Candidate)` : "STANDBY"}</b>
            </p>
            <div className="clock-big" style={{ color: "var(--dim)" }}>
              STANDBY
            </div>

            {/* Preserved explanatory text */}
            <div className="launch-standby-readout">
              <span className="label">Autonomous launch / Phase 0 Standby</span>
              <h3>No active launch candidate</h3>
              <p>Launch countdown and checkpoints will activate once a pairing candidate is approved and scheduled by the operator.</p>
            </div>

            <p className="label" style={{ marginTop: "24px" }}>Phase 0 / Launch Cycle Sequence (Standby)</p>
            <ol className="lcycle">
              {STANDBY_STAGES.map((stage) => (
                <li key={stage.id} className="lcycle-standby">
                  <span>{stage.point}</span>
                  <span>{stage.desc}</span>
                  <span className="s">STANDBY</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <div className="facts">
              <Fact
                label="Opportunity / pairing score"
                value={pairing ? `${pairing.stockSymbol} / ${pairing.pairScore} (Candidate)` : "STANDBY"}
              />
              <Fact label="Pre-launch checks" value="0 / 8 passed (Standby)" />
              <Fact
                label="Pairing asset"
                value={pairing ? `${pairing.stockSymbol} Stock Token / Pending admin approval` : "Awaiting approved pairing"}
              />
              <Fact label="Agent wallet" value="JEVO Agent Wallet / scoped permissions" />
              <Fact label="Guardian approval" value="REQUIRED (Operator gate)" />
              <Fact label="Transaction" value="NOT SUBMITTED (Standby)" />
            </div>

            <div className="perm">
              <PermissionGroup
                title="Agent can"
                items={[
                  "Deploy the approved token template",
                  "Initialise an approved pool",
                  "Call the approved launch function",
                ]}
              />
              <PermissionGroup
                title="Agent cannot"
                items={[
                  "Make arbitrary transfers",
                  "Withdraw treasury",
                  "Change launch parameters",
                ]}
                restricted
              />
            </div>
          </div>
        </div>

        {/* 03. Visual Preview of 8 Pre-Launch Policy Checks */}
        <div className="launch-policy-section">
          <div className="plane-meta" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
            <span className="label"><b>PRE-LAUNCH POLICY CHECKS (8 GATES)</b> / STANDBY PREVIEW</span>
            <span className="label">ALL CHECKS MANDATORY BEFORE EXECUTION</span>
          </div>
          <div className="launch-policy-grid">
            {STANDBY_POLICY_CHECKS.map((check) => (
              <div key={check.id} className="policy-card--standby">
                <div className="policy-card-top">
                  <span className="policy-badge">○ STANDBY</span>
                  <span className="policy-id">{check.id}</span>
                </div>
                <h4>{check.label}</h4>
                <p>{check.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 04. Launch Footer */}
        <div className="launch-footer">
          <div className="launch-footer-actions">
            <Link className="btn btn-sm" href="/pairing">
              Review Pairing Candidates →
            </Link>
            <Link
              className="btn btn-sm"
              style={{ background: "transparent", border: "1px solid var(--line)" }}
              href="/app"
            >
              Inspect Opportunity Field →
            </Link>
          </div>
          <span className="label">Phase 0 / Operator Approval Gate Active · Execution Restricted</span>
        </div>
      </section>
    );
  }

  // When an active launch exists:
  const passed = launch.policyChecks.filter((check) => check.status === "PASSED").length;
  return (
    <section className="app-reference-view">
      <div className="page-head">
        <div>
          <h2>Autonomous launch</h2>
          <p>Autonomous does not mean unrestricted. A qualified pair moves through a policy-checked cycle before anything reaches Robinhood Chain.</p>
        </div>
        <span className="label">Launch candidate <b>{launch.cycleId}</b></span>
      </div>
      <ol className="lstages">
        {launch.stages.map((stage) => (
          <li key={stage.id} className={`lstage ${stage.status === "COMPLETE" ? "done" : stage.status === "ACTIVE" ? "now" : ""}`}>
            <span className="st">{stage.status === "ACTIVE" ? "● Current" : stage.status === "COMPLETE" ? "Done" : "Pending"}</span>
            <h4>{stage.id.replaceAll("_", " ")}</h4>
            <p>{stage.description}</p>
          </li>
        ))}
      </ol>
      <div className="launch-grid">
        <div>
          <p className="label">Next agent launch / <b>{pairing ? `${pairing.stockSymbol} × ${pairing.symbol}` : "STANDBY"}</b></p>
          <div className="clock-big">T-{formatCountdown(launch.countdownSeconds)}</div>
          <p className="label">Phase 0 / worker launch state</p>
          <ol className="lcycle">
            {launch.stages.map((stage) => (
              <li key={stage.id} className={stage.status === "COMPLETE" ? "done" : stage.status === "ACTIVE" ? "now" : ""}>
                <span>{stage.scheduledPoint}</span>
                <span>{stage.description}</span>
                <span className="s">{stage.status === "COMPLETE" ? "✓" : stage.status === "ACTIVE" ? "● Now" : "Pending"}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="facts">
            <Fact label="Opportunity / pairing score" value={pairing ? `${pairing.stockSymbol} / ${pairing.pairScore}` : "STANDBY"} />
            <Fact label="Pre-launch checks" value={`${passed} / ${launch.policyChecks.length} passed`} />
            <Fact label="Pairing asset" value={pairing ? `${pairing.stockSymbol} Stock Token / canonical address required` : "STANDBY"} />
            <Fact label="Agent wallet" value={`${launch.wallet.label} / scoped permissions`} />
            <Fact label="Guardian approval" value={launch.guardianRequirement.status} />
            <Fact label="Transaction" value={launch.transactionState.replaceAll("_", " ")} accent />
          </div>
          <div className="perm">
            <PermissionGroup title="Agent can" items={["Deploy the approved token template", "Initialise an approved pool", "Call the approved launch function"]} />
            <PermissionGroup title="Agent cannot" items={["Make arbitrary transfers", "Withdraw treasury", "Change launch parameters"]} restricted />
          </div>
        </div>
      </div>
      <div className="launch-footer">
        <Link className="btn btn-sm" href={`/launch/${launch.selectedPairingSlug}`}>Open launch detail ↗</Link>
        <span className="label">Phase 0 / {launch.transactionState.replaceAll("_", " ")}</span>
      </div>
    </section>
  );
}

function Fact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="fact">
      <span className="label">{label}</span>
      <span className={`v${accent ? " on" : ""}`}>{value}</span>
    </div>
  );
}

function PermissionGroup({ title, items, restricted = false }: { title: string; items: string[]; restricted?: boolean }) {
  return (
    <div className={restricted ? "no" : undefined}>
      <p className="label">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
