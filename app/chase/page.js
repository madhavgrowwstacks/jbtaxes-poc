"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  Check,
  ChevronRight,
  ExternalLink,
  FileSearch,
  MessageSquare,
  Phone,
  PhoneCall,
  PartyPopper,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import ReminderModal from "../../components/ReminderModal";
import ClosedSeasonNotice from "../../components/ClosedSeasonNotice";
import { useStore } from "../../components/store";
import { AIBadge, Avatar, Badge, Button, Card, EmptyState, ProgressBar, Segmented, Table, useToast } from "../../components/ui";
import { CHASE } from "../../lib/data";
import { cx, fmtWhen } from "../../lib/utils";

const SEVERITY = { high: ["danger", "High"], medium: ["warning", "Medium"], low: ["neutral", "Low"] };
const RESULT_TONE = { Replied: "success", Opened: "info", Delivered: "neutral" };

export default function ChaseQueue() {
  const { chase, getClient, actions, isArchived } = useStore();
  const toast = useToast();
  const [askFlag, setAskFlag] = useState(null);
  const [nudgeFilter, setNudgeFilter] = useState("All");

  if (isArchived) {
    return (
      <ClosedSeasonNotice pageTitle="Chase queue" title="Tax year {year} is closed — nothing left to chase">
        The chase queue runs during the live season. Every return for that year has been filed.
      </ClosedSeasonNotice>
    );
  }

  const calls = CHASE.noResponse.map((r) => ({ ...r, client: getClient(r.id) })).filter((r) => r.client);
  const calledCount = calls.filter((r) => chase.called[r.id]).length;
  const callsLeft = calls.length - calledCount;
  const openFlags = CHASE.flags.filter((f) => !chase.resolved[f.id]);
  const resolvedFlags = CHASE.flags.filter((f) => chase.resolved[f.id]);
  const nudges = CHASE.nudgedOvernight.filter((n) => nudgeFilter === "All" || n.result === nudgeFilter);

  const markCalled = (r) => {
    actions.markCalled(r.id);
    toast({
      title: `${r.client.name} marked as called`,
      description: "Logged to the client's activity.",
      action: { label: "Undo", onClick: () => actions.undoCalled(r.id) },
    });
  };

  const resolve = (f) => {
    actions.resolveFlag(f.id);
    toast({
      title: "Flag resolved",
      description: getClient(f.clientId)?.name,
      action: { label: "Undo", onClick: () => actions.reopenFlag(f.id) },
    });
  };

  const askClient = askFlag ? getClient(askFlag.clientId) : null;
  const askFirst = askClient ? (askClient.type === "1040" ? askClient.name.split(" ")[0] : askClient.name) : "";

  return (
    <div className="page">
      <PageHeader
        title="This morning's chase queue"
        description="What the reminder engine handled overnight, and what needs a human today."
      />

      <div className="stat-grid">
        <Card pad={false}>
          <div className="stat-card">
            <span className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
              <BellRing size={20} />
            </span>
            <div>
              <div className="stat-value">{CHASE.nudgedOvernight.length}</div>
              <div className="stat-label">Clients nudged automatically overnight</div>
            </div>
          </div>
        </Card>
        <Card pad={false}>
          <div className="stat-card">
            <span className="stat-icon" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
              <PhoneCall size={20} />
            </span>
            <div>
              <div className="stat-value">{callsLeft}</div>
              <div className="stat-label">No response in 72h — need a call ({calledCount} done)</div>
            </div>
          </div>
        </Card>
        <Card pad={false}>
          <div className="stat-card">
            <span className="stat-icon" style={{ background: "var(--info-bg)", color: "var(--info)" }}>
              <FileSearch size={20} />
            </span>
            <div>
              <div className="stat-value">{CHASE.uploadedOvernight}</div>
              <div className="stat-label">Uploads overnight · {openFlags.length} flagged by AI</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card
          title="Needs a human call today"
          subtitle="Auto-reminders haven't worked — a phone call usually does"
          actions={<Badge tone={callsLeft ? "warning" : "success"}>{calledCount}/{calls.length} called</Badge>}
        >
          <ProgressBar size="sm" label="Calls completed" total={calls.length} segments={[{ value: calledCount, tone: "success" }]} />
          <div style={{ marginTop: 16 }}>
            {calls.map((r) => {
              const calledAt = chase.called[r.id];
              return (
                <div key={r.id} className={cx("list-row", calledAt && "is-done")}>
                  <Avatar name={r.client.name} size={36} />
                  <div className="list-row-main">
                    <div className="list-row-title">
                      <Link href={`/client/${r.id}`}>{r.client.name}</Link>
                      {calledAt ? <Badge tone="success" icon={Check}>Called {fmtWhen(calledAt)}</Badge> : <Badge tone="danger">{r.days}d silent</Badge>}
                    </div>
                    <div className="list-row-sub">
                      Last tried {r.channel} · needs {r.reason}
                    </div>
                    <div className="list-row-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Phone size={12} aria-hidden /> {r.client.phone}
                    </div>
                  </div>
                  <div className="list-row-actions">
                    {calledAt ? (
                      <Button size="sm" variant="ghost" icon={Undo2} onClick={() => actions.undoCalled(r.id)}>
                        Undo
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" icon={PhoneCall} onClick={() => markCalled(r)}>
                        Mark as called
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {callsLeft === 0 && (
            <div className="hint" style={{ marginTop: 16, color: "var(--success)", fontWeight: 600 }}>
              <PartyPopper size={15} aria-hidden /> All calls done for today.
            </div>
          )}
        </Card>

        <Card
          title="AI document flags"
          subtitle="Uploads that don't match what the client told us — the AI already asked the client"
          actions={<AIBadge>AI document check</AIBadge>}
        >
          {openFlags.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No open flags">
              Every overnight upload matches the client's intake answers.
            </EmptyState>
          ) : (
            openFlags.map((f) => {
              const client = getClient(f.clientId);
              const [tone, label] = SEVERITY[f.severity];
              return (
                <div key={f.id} className="flag">
                  <div className="flag-head">
                    <div className="list-row-title">
                      <Avatar name={client.name} size={26} />
                      <Link href={`/client/${client.id}`}>{client.name}</Link>
                    </div>
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      {client.status === "ai_flagged" && <Badge tone="violet">Auto-sent to client</Badge>}
                      <Badge tone={tone} dot>
                        {label}
                      </Badge>
                    </span>
                  </div>
                  <div className="flag-text">
                    <AlertTriangle size={15} aria-hidden />
                    <span>{f.flag}</span>
                  </div>
                  <div className="flag-actions">
                    <Button size="sm" variant="secondary" icon={Check} onClick={() => resolve(f)}>
                      Resolve
                    </Button>
                    <Button size="sm" variant="ghost" icon={MessageSquare} onClick={() => setAskFlag(f)}>
                      Ask client
                    </Button>
                    <Button size="sm" variant="ghost" icon={ExternalLink} href={`/client/${client.id}`}>
                      Open
                    </Button>
                  </div>
                </div>
              );
            })
          )}
          {resolvedFlags.length > 0 && (
            <details className="disclosure">
              <summary>
                <ChevronRight size={14} aria-hidden /> Resolved today ({resolvedFlags.length})
              </summary>
              {resolvedFlags.map((f) => (
                <div key={f.id} className="resolved-row">
                  <s>
                    {getClient(f.clientId)?.name} — {f.flag}
                  </s>
                  <button type="button" className="link-btn" onClick={() => actions.reopenFlag(f.id)}>
                    Reopen
                  </button>
                </div>
              ))}
            </details>
          )}
        </Card>
      </div>

      <Card
        style={{ marginTop: 24 }}
        pad={false}
        title="Overnight auto-nudges"
        subtitle="Sent at 7:00 AM by the reminder engine, segmented by what each client still owes"
        actions={
          <Segmented size="sm" value={nudgeFilter} onChange={setNudgeFilter} options={["All", "Replied", "Opened", "Delivered"]} ariaLabel="Filter by result" />
        }
      >
        <div style={{ marginTop: 16 }}>
          <Table minWidth={620}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Channel</th>
                <th>Requested</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {nudges.map((n) => (
                <tr key={n.name}>
                  <td>
                    <div className="ct-client">
                      <Avatar name={n.name} size={26} />
                      <span style={{ fontWeight: 600 }}>{n.name}</span>
                    </div>
                  </td>
                  <td className="text-2">{n.channel}</td>
                  <td className="text-2">{n.items}</td>
                  <td>
                    <Badge tone={RESULT_TONE[n.result]} dot>
                      {n.result}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      <ReminderModal
        client={askClient}
        open={!!askFlag}
        onClose={() => setAskFlag(null)}
        title="Ask the client about this flag"
        defaultMessage={askFlag ? `Hi ${askFirst}, quick question while we review your documents: ${askFlag.ask}` : undefined}
      />
    </div>
  );
}
