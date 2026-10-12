"use client";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Play,
  ScanSearch,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import ClosedSeasonNotice from "../../components/ClosedSeasonNotice";
import { useStore } from "../../components/store";
import { Avatar, Badge, Button, Card, EmptyState, SourceTag, useToast } from "../../components/ui";
import { openFlagsFor } from "../../lib/utils";

const CHECKS = ["All documents received", "Legible & complete", "Names and SSN/EIN match", "Income matches last year's sources", "Intake answers agree with documents"];

export default function AiCheckPage() {
  const { clients, totals, activity, chase, actions, aiChecks, isArchived } = useStore();
  const toast = useToast();

  if (isArchived) {
    return (
      <ClosedSeasonNotice pageTitle="AI document check" title="The AI check runs on the live season only">
        That season closed before the AI document check was introduced.
      </ClosedSeasonNotice>
    );
  }

  const checking = clients.filter((c) => c.status === "ai_checking");
  const passed = clients.filter((c) => c.status === "ai_verified");
  const flagged = clients.filter((c) => c.status === "ai_flagged");
  const todayCount = (kind) => activity.filter((a) => a.batch?.kind === kind).reduce((n, a) => n + a.batch.items.length, 0);

  const sendTo = (c, status, who) => {
    actions.setStatus(c.id, status);
    toast({ title: `${c.name} sent to ${who}`, description: "Status synced to ProConnect." });
  };

  return (
    <div className="page">
      <PageHeader
        title="AI document check"
        description="Every finished upload is checked by AI before a preparer touches it. Clean files go to human review; problems go straight back to the client."
        actions={
          checking.length > 0 && (
            <Button icon={Play} onClick={() => checking.forEach((c) => actions.runAiCheck(c.id))}>
              Run {checking.length} pending {checking.length === 1 ? "check" : "checks"}
            </Button>
          )
        }
      />

      <Card className="flow-card" pad={false}>
        <div className="flow">
          <div className="flow-step">
            <span className="flow-icon tone-soft-warning"><Upload size={18} /></span>
            <div className="flow-title">Client uploads</div>
            <div className="flow-sub">Reminders run until every requested document is in</div>
            <div className="flow-count">{totals.waiting.toLocaleString()} <span>waiting on clients</span></div>
          </div>
          <ArrowRight className="flow-arrow" size={20} aria-hidden />
          <div className="flow-step is-ai">
            <span className="flow-icon tone-soft-violet"><ScanSearch size={18} /></span>
            <div className="flow-title">
              AI checks <SourceTag source="ai" compact />
            </div>
            <div className="flow-sub">{CHECKS.length} checks on every return</div>
            <div className="flow-count">{totals.ai_check} <span>checking now</span></div>
          </div>
          <ArrowRight className="flow-arrow" size={20} aria-hidden />
          <div className="flow-branch">
            <div className="flow-branch-row is-pass">
              <CheckCircle2 size={16} aria-hidden />
              <div>
                <div className="flow-title">Passed → ready for human review</div>
                <div className="flow-sub">{todayCount("ai-passed")} passed today · {totals.ready_review} waiting for a reviewer</div>
              </div>
            </div>
            <div className="flow-branch-row is-flag">
              <AlertTriangle size={16} aria-hidden />
              <div>
                <div className="flow-title">Flagged → sent back to client</div>
                <div className="flow-sub">{todayCount("ai-flagged")} flagged today · the client gets the question automatically</div>
              </div>
            </div>
          </div>
          <ArrowRight className="flow-arrow" size={20} aria-hidden />
          <div className="flow-step">
            <span className="flow-icon tone-soft-info"><Users size={18} /></span>
            <div className="flow-title">
              Human review <SourceTag source="proconnect" compact />
            </div>
            <div className="flow-sub">For Review (Jas) · For Review (Lhudy)</div>
            <div className="flow-count">{totals.review} <span>in review</span></div>
          </div>
        </div>
      </Card>

      <div className="lanes">
        <Card title="Checking now" subtitle="Documents are in — AI is verifying them" actions={<Badge tone="violet">{checking.length}</Badge>}>
          {checking.length === 0 ? (
            <EmptyState icon={ScanSearch} title="Nothing in the queue">New uploads appear here automatically.</EmptyState>
          ) : (
            checking.map((c) => (
              <div key={c.id} className="lane-row">
                <Avatar name={c.name} size={32} />
                <div className="lane-main">
                  <Link href={`/client/${c.id}`} className="lane-name">{c.name}</Link>
                  <div className="lane-sub">
                    <Loader2 size={12} className="spin" aria-hidden /> Running {CHECKS.length} checks · {c.assignee}
                  </div>
                </div>
                <Button size="sm" variant="ghost" icon={Play} onClick={() => actions.runAiCheck(c.id)}>
                  Run now
                </Button>
              </div>
            ))
          )}
        </Card>

        <Card
          title="Passed — needs a reviewer"
          subtitle="AI-verified; a human takes it from here"
          actions={<Badge tone="success">{passed.length}</Badge>}
        >
          {passed.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="All picked up">Nothing is waiting for a reviewer.</EmptyState>
          ) : (
            passed.map((c) => {
              const checks = aiChecks(c.id);
              return (
                <div key={c.id} className="lane-row">
                  <Avatar name={c.name} size={32} />
                  <div className="lane-main">
                    <Link href={`/client/${c.id}`} className="lane-name">{c.name}</Link>
                    <div className="lane-sub">
                      <CheckCircle2 size={12} aria-hidden style={{ color: "var(--success)" }} /> {checks.filter((x) => x.result === "pass").length} of {checks.length} checks passed · {c.assignee}
                    </div>
                    <div className="lane-actions">
                      <Button size="sm" icon={UserCheck} onClick={() => sendTo(c, "review_jas", "For Review (Jas)")}>
                        Jas
                      </Button>
                      <Button size="sm" variant="secondary" icon={UserCheck} onClick={() => sendTo(c, "review_lhudy", "For Review (Lhudy)")}>
                        Lhudy
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>

        <Card
          title="Flagged — back with the client"
          subtitle="Question sent automatically; no preparer time spent"
          actions={<Badge tone="warning">{flagged.length}</Badge>}
        >
          {flagged.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No flags">Every checked return passed.</EmptyState>
          ) : (
            flagged.map((c) => {
              const flags = openFlagsFor(c.id, chase.resolved);
              return (
                <div key={c.id} className="lane-row">
                  <Avatar name={c.name} size={32} />
                  <div className="lane-main">
                    <Link href={`/client/${c.id}`} className="lane-name">{c.name}</Link>
                    <div className="lane-flag">
                      <AlertTriangle size={13} aria-hidden /> {flags[0]?.flag || "Needs the client's input"}
                    </div>
                    <div className="lane-sub">
                      {c.channel === "SMS" ? <MessageSquare size={12} aria-hidden /> : <Mail size={12} aria-hidden />} Asked by {c.channel} automatically · {c.assignee}
                    </div>
                    <div className="lane-actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={UserCheck}
                        onClick={() => {
                          actions.overrideAiFlag(c.id);
                          toast({ title: "AI flag overridden", description: `${c.name} moved to ready for review.` });
                        }}
                      >
                        Override → review
                      </Button>
                      <Button size="sm" variant="ghost" href={`/client/${c.id}`}>
                        Open
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>

      <p className="hint" style={{ marginTop: 16 }}>
        Lanes list the sample clients; the flow above shows firm-wide numbers. Statuses tagged <SourceTag source="ai" compact /> live in the JB Taxes
        portal; <SourceTag source="proconnect" compact /> statuses sync with ProConnect.
      </p>
    </div>
  );
}
