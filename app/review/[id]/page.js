"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, FileQuestion, Pencil, RefreshCw, Send, ShieldCheck, X } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import ClosedSeasonNotice from "../../../components/ClosedSeasonNotice";
import { useStore } from "../../../components/store";
import { AIBadge, Avatar, Badge, Button, Card, EmptyState, Field, Select, StatusBadge, useToast } from "../../../components/ui";
import { CURRENT_TAX_YEAR, REVIEWS, RETURN_TYPE_LABELS } from "../../../lib/data";
import { cx, fmtWhen } from "../../../lib/utils";

const APPROVALS = [
  { key: "figures", label: "Figures match the final return" },
  { key: "tone", label: "Language is clear and jargon-free" },
  { key: "recs", label: "Recommendations are appropriate for this client" },
];

const toParagraphs = (text) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const toLines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);

export default function ReviewPage({ params }) {
  const { getReview, getClient, actions, isArchived } = useStore();
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ summary: "", recommendations: "" });
  const [regenerating, setRegenerating] = useState(false);

  if (isArchived) {
    return (
      <ClosedSeasonNotice pageTitle="AI review summary" title="No AI summaries for tax year {year}">
        AI-drafted client summaries started with the {CURRENT_TAX_YEAR} season.
      </ClosedSeasonNotice>
    );
  }

  const id = params.id;
  const review = getReview(id);
  const client = getClient(id);
  const reviewIds = Object.keys(REVIEWS);

  if (!review || !client) {
    return (
      <div className="page page-narrow">
        <PageHeader breadcrumbs={[{ label: "AI Reviews", href: "/review/sarah-mitchell" }, { label: "Not found" }]} />
        <Card>
          <EmptyState icon={FileQuestion} title="No AI summary for this client yet">
            Summaries are drafted once a return is finalized. Try one of these:
          </EmptyState>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", paddingBottom: 24 }}>
            {reviewIds.map((rid) => (
              <Button key={rid} variant="secondary" href={`/review/${rid}`}>
                {getClient(rid)?.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const approvals = review.approvals || {};
  const approvedCount = APPROVALS.filter((a) => approvals[a.key]).length;
  const allApproved = approvedCount === APPROVALS.length;
  const isEdited = review.summary !== review.original.summary || review.recommendations !== review.original.recommendations;

  const startEdit = () => {
    setDraft({ summary: review.summary, recommendations: review.recommendations });
    setEditing(true);
  };
  const save = () => {
    actions.saveReview(id, { summary: draft.summary.trim(), recommendations: draft.recommendations.trim(), editedAt: Date.now() });
    setEditing(false);
    toast({ title: "Summary saved", description: "Your edits replace the AI draft for this client." });
  };
  const regenerate = () => {
    setEditing(false);
    setRegenerating(true);
    setTimeout(() => {
      actions.saveReview(id, { summary: undefined, recommendations: undefined, editedAt: undefined });
      setRegenerating(false);
      toast({ title: "Summary regenerated", description: "Fresh draft from the final return figures." });
    }, 1500);
  };
  const send = () => {
    if (editing) save();
    actions.sendReview(id);
    toast({ title: `Summary sent to ${client.name}`, description: `Emailed to ${client.email} and logged on their record.` });
  };
  const toggleApproval = (key) => actions.saveReview(id, { approvals: { ...approvals, [key]: !approvals[key] } });

  const status = review.sentAt ? (
    <Badge tone="success" icon={Check}>Sent {fmtWhen(review.sentAt)}</Badge>
  ) : isEdited ? (
    <Badge tone="info" icon={Pencil}>Edited draft</Badge>
  ) : (
    <AIBadge>AI draft</AIBadge>
  );

  return (
    <div className="page">
      <PageHeader
        breadcrumbs={[{ label: "AI Reviews", href: "/review/sarah-mitchell" }, { label: client.name }]}
        title="AI review summary"
        description="A plain-English summary of the finished return that the firm can hand to the client — the AI drafts, a human signs off."
        actions={
          <div className="no-print">
            <Select
              value={id}
              options={reviewIds.map((rid) => ({
                value: rid,
                label: getClient(rid)?.name,
                render: (
                  <>
                    <Avatar name={getClient(rid)?.name} size={20} />
                    {getClient(rid)?.name}
                  </>
                ),
              }))}
              onChange={(v) => router.push(`/review/${v}`)}
              ariaLabel="Choose a client summary"
              menuWidth={260}
              align="end"
            />
          </div>
        }
      />

      <div className="review-layout">
        <Card pad={false}>
          <article className="doc">
            <header className="doc-head">
              <div>
                <div className="doc-title">
                  {client.name} — {review.year} Return Summary
                </div>
                <div className="doc-sub">
                  Prepared by {client.assignee} · JB Taxes · Drafted by AI from {review.basis ? "the return data below" : "the final return"}
                </div>
                {review.basis && <div className="doc-sub">Source: {review.basis}</div>}
              </div>
              {status}
            </header>

            <div className="figure-grid">
              {review.figures.map((f) => (
                <div key={f.label} className="figure">
                  <div className="figure-label">{f.label}</div>
                  <div className="figure-value">{f.value}</div>
                </div>
              ))}
            </div>

            <section className="doc-section">
              <h3 className="doc-h">Your return at a glance</h3>
              {regenerating ? (
                <Shimmer lines={5} />
              ) : editing ? (
                <Field hint="Separate paragraphs with a blank line." htmlFor="ed-summary">
                  <textarea
                    id="ed-summary"
                    className="textarea doc-edit-area"
                    rows={10}
                    value={draft.summary}
                    onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                    autoFocus
                  />
                </Field>
              ) : (
                toParagraphs(review.summary).map((p, i) => (
                  <p key={i} className="doc-p">
                    {p}
                  </p>
                ))
              )}
            </section>

            <section className="doc-section">
              <h3 className="doc-h">Recommendations for next year</h3>
              {regenerating ? (
                <Shimmer lines={3} />
              ) : editing ? (
                <Field hint="One recommendation per line." htmlFor="ed-recs">
                  <textarea
                    id="ed-recs"
                    className="textarea doc-edit-area"
                    rows={6}
                    value={draft.recommendations}
                    onChange={(e) => setDraft((d) => ({ ...d, recommendations: e.target.value }))}
                  />
                </Field>
              ) : (
                toLines(review.recommendations).map((r, i) => (
                  <div key={i} className="doc-rec">
                    <span className="doc-rec-n">{i + 1}</span>
                    <span>{r}</span>
                  </div>
                ))
              )}
            </section>
          </article>

          <div className="doc-toolbar no-print">
            {editing ? (
              <>
                <Button icon={Check} onClick={save} disabled={!draft.summary.trim()}>
                  Save changes
                </Button>
                <Button variant="secondary" icon={X} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" icon={Pencil} onClick={startEdit} disabled={regenerating}>
                  Edit summary
                </Button>
                <Button variant="secondary" icon={RefreshCw} loading={regenerating} onClick={regenerate}>
                  {regenerating ? "Regenerating…" : "Regenerate"}
                </Button>
                <Button variant="ghost" icon={Download} onClick={() => window.print()} disabled={regenerating}>
                  Download PDF
                </Button>
              </>
            )}
            <span className="spacer" />
            {!allApproved && <span className="hint">Complete sign-off to send</span>}
            <Button icon={Send} onClick={send} disabled={!allApproved || regenerating}>
              {review.sentAt ? "Resend to client" : "Send to client"}
            </Button>
          </div>
        </Card>

        <div className="stack no-print">
          <Card
            title="Human sign-off"
            subtitle="Required before anything reaches the client"
            actions={<Badge tone={allApproved ? "success" : "neutral"}>{approvedCount}/{APPROVALS.length}</Badge>}
          >
            <div className="approve-list">
              {APPROVALS.map((a) => (
                <label key={a.key} className={cx("approve-item", approvals[a.key] && "is-checked")}>
                  <input type="checkbox" checked={!!approvals[a.key]} onChange={() => toggleApproval(a.key)} />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
            {allApproved && (
              <div className="hint" style={{ marginTop: 12, color: "var(--success)", fontWeight: 600 }}>
                <ShieldCheck size={15} aria-hidden /> Approved by Jasmin Baros
              </div>
            )}
          </Card>

          <Card title="Return details">
            <div className="kv-list">
              <div className="kv">
                <span className="kv-k">Client</span>
                <Link href={`/client/${client.id}`} className="kv-v link-btn" style={{ fontSize: 13.5 }}>
                  {client.name}
                </Link>
              </div>
              <div className="kv">
                <span className="kv-k">Return</span>
                <span className="kv-v">
                  {client.type} · {RETURN_TYPE_LABELS[client.type]}
                </span>
              </div>
              <div className="kv">
                <span className="kv-k">Filing status</span>
                <span className="kv-v">{client.filingStatus}</span>
              </div>
              <div className="kv">
                <span className="kv-k">Preparer</span>
                <span className="kv-v">{client.assignee}</span>
              </div>
              <div className="kv">
                <span className="kv-k">Status</span>
                <StatusBadge status={client.status} showSource />
              </div>
            </div>
          </Card>

          <p className="text-3" style={{ fontSize: 12.5 }}>
            {review.basis
              ? "Figures come from the firm's 2025 vs 2024 tax summary export. Every summary is reviewed and approved by the firm before it reaches a client."
              : "Figures are illustrative sample data. In production, every summary is reviewed and approved by the firm before it reaches a client."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Shimmer({ lines }) {
  return (
    <div aria-label="Regenerating" role="status">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="shimmer-line" style={{ width: `${i === lines - 1 ? 60 : 92 - (i % 3) * 8}%` }} />
      ))}
    </div>
  );
}
