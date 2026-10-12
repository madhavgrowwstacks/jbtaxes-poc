"use client";
import { AlertTriangle, CheckCircle2, Circle, Loader2, Play, RotateCcw, ShieldCheck, UserCheck } from "lucide-react";
import { useStore } from "./store";
import { Button, Card, SourceTag, StatusBadge, useToast } from "./ui";
import { cx, groupOf } from "../lib/utils";

const RESULT_ICON = { pass: CheckCircle2, flag: AlertTriangle, pending: Circle, running: Loader2 };

// The AI layer between "client sent everything" and "a human reviews".
export default function AiCheckCard({ client }) {
  const { aiChecks, actions } = useStore();
  const toast = useToast();
  const group = groupOf(client);
  const running = client.status === "ai_checking";
  const checks = aiChecks(client.id).map((c) => (running ? { ...c, result: "running" } : c));
  const passed = checks.filter((c) => c.result === "pass").length;

  let state;
  if (running) state = { tone: "violet", title: "AI is checking the documents…", text: "Clean files go to human review; anything odd goes straight back to the client." };
  else if (client.status === "ai_verified") state = { tone: "success", title: "Passed — ready for human review", text: "Every check passed. Pick a reviewer to start." };
  else if (client.status === "ai_flagged") state = { tone: "warning", title: "Flagged — sent back to the client automatically", text: "The client was asked about the issue below. No preparer time spent yet." };
  else if (["new", "waiting", "extension"].includes(group)) state = { tone: "neutral", title: "Waiting for documents", text: "The AI check runs automatically as soon as the last document arrives." };
  else state = { tone: "success", title: "Passed the AI check", text: "This return is with a human now." };

  const sendTo = (status, who) => {
    actions.setStatus(client.id, status);
    toast({ title: `Sent to ${who} for review`, description: "Status synced to ProConnect." });
  };

  return (
    <Card
      className={cx("ai-card", `ai-card-${state.tone}`)}
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          AI document check <SourceTag source="ai" />
        </span>
      }
      subtitle="Runs before any preparer sees the return"
      actions={<StatusBadge status={client.status} showSource />}
    >
      <div className="ai-state">
        {running ? <Loader2 size={18} className="spin" /> : state.tone === "warning" ? <AlertTriangle size={18} /> : state.tone === "success" ? <ShieldCheck size={18} /> : <Circle size={18} />}
        <div>
          <div className="ai-state-title">{state.title}</div>
          <div className="ai-state-text">{state.text}</div>
        </div>
      </div>

      <ul className="ai-checks">
        {checks.map((c) => {
          const Icon = RESULT_ICON[c.result];
          return (
            <li key={c.label} className={cx("ai-check", `is-${c.result}`)}>
              <Icon size={15} className={c.result === "running" ? "spin" : undefined} aria-hidden />
              <span className="ai-check-label">{c.label}</span>
              {c.note && <span className="ai-check-note">{c.note}</span>}
            </li>
          );
        })}
      </ul>
      {!running && group !== "new" && (
        <div className="hint" style={{ marginTop: 8 }}>
          {passed} of {checks.length} checks passed
        </div>
      )}

      <div className="ai-actions">
        {client.status === "ai_verified" && (
          <>
            <Button size="sm" icon={UserCheck} onClick={() => sendTo("review_jas", "Jasmin")}>
              For Review (Jas)
            </Button>
            <Button size="sm" variant="secondary" icon={UserCheck} onClick={() => sendTo("review_lhudy", "Ludy")}>
              For Review (Lhudy)
            </Button>
          </>
        )}
        {client.status === "ai_flagged" && (
          <Button
            size="sm"
            variant="secondary"
            icon={UserCheck}
            onClick={() => {
              actions.overrideAiFlag(client.id);
              toast({ title: "AI flag overridden", description: `${client.name} moved to AI-verified · ready for review.` });
            }}
          >
            Override — send to review
          </Button>
        )}
        {!running && ["new", "waiting", "extension"].includes(group) && (
          <Button size="sm" variant="ghost" icon={client.status === "ai_flagged" ? RotateCcw : Play} onClick={() => actions.runAiCheck(client.id)}>
            {client.status === "ai_flagged" ? "Re-run check" : "Run AI check now"}
          </Button>
        )}
      </div>
    </Card>
  );
}
