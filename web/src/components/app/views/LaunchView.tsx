"use client";

import Link from "next/link";

import { formatCountdown } from "@/lib/format";
import type { Launch } from "@/types/launch";
import type { Pairing } from "@/types/pairing";

export function LaunchView({ launch, pairing }: { launch?: Launch | null; pairing?: Pairing | null }) {
  if (!launch) {
    return (
      <section className="app-reference-view">
        <div className="page-head">
          <div>
            <h2>Autonomous launch</h2>
            <p>Autonomous does not mean unrestricted. A qualified pair moves through a policy-checked cycle before anything reaches Robinhood Chain.</p>
          </div>
          <span className="label">Phase 0 / Standby</span>
        </div>
        <div className="app-launch-layout empty-state" style={{ marginTop: "2rem" }}>
          <div className="app-launch-readout">
            <span className="label">Autonomous launch / Phase 0</span>
            <div className="clock-big">STANDBY</div>
            <h3>Belum ada launch aktif</h3>
            <p>Countdown dan checkpoint launch akan aktif setelah kandidat pairing disetujui dan dijadwalkan oleh operator.</p>
          </div>
        </div>
      </section>
    );
  }

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

function Fact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="fact"><span className="label">{label}</span><span className={`v${accent ? " on" : ""}`}>{value}</span></div>; }
function PermissionGroup({ title, items, restricted = false }: { title: string; items: string[]; restricted?: boolean }) { return <div className={restricted ? "no" : undefined}><p className="label">{title}</p><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
