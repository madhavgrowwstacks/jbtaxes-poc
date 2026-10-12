"use client";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Archive,
  CalendarX,
  Check,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  MousePointerClick,
  Pencil,
  Phone,
  Send,
  Sparkles,
  UserX,
  X,
} from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import { reminderTemplate } from "../../../components/ReminderModal";
import { useStore } from "../../../components/store";
import {
  AIBadge,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  ProgressBar,
  Segmented,
  Select,
  SourceTag,
  StatusBadge,
  useToast,
} from "../../../components/ui";
import AiCheckCard from "../../../components/AiCheckCard";
import { STATUS_OPTIONS } from "../../../components/statusOptions";
import { ASSIGNEES, CURRENT_TAX_YEAR, FILING_STATUSES, RETURN_TYPE_LABELS } from "../../../lib/data";
import { checklistCounts, clientSince, cx, fmtDateTime, groupOf, statusMeta } from "../../../lib/utils";

const STATUS_ICON = { received: CheckCircle2, pending: Clock, missing: AlertCircle };
const NEXT_STATUS = { missing: "pending", pending: "received", received: "missing" };

export default function ClientDetail({ params }) {
  const { getClient, getYearClient, getYearDetail, getReview, actions, isArchived: readOnly, taxYear } = useStore();
  const toast = useToast();
  const client = getYearClient(params.id);

  if (!client) {
    const joinedLater = readOnly && getClient(params.id);
    if (joinedLater) {
      return (
        <div className="page">
          <PageHeader breadcrumbs={[{ label: "Clients", href: "/clients" }, { label: joinedLater.name }]} />
          <Card>
            <EmptyState
              icon={CalendarX}
              title={`No tax year ${taxYear} record for ${joinedLater.name}`}
              action={<Button onClick={() => actions.setTaxYear(CURRENT_TAX_YEAR)}>View tax year {CURRENT_TAX_YEAR}</Button>}
            >
              {joinedLater.name} became a client in {clientSince(joinedLater.id)}.
            </EmptyState>
          </Card>
        </div>
      );
    }
    return (
      <div className="page">
        <Card>
          <EmptyState icon={UserX} title="Client not found" action={<Button href="/clients">Back to clients</Button>}>
            There's no client with the id “{params.id}” in this sample data.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const detail = getYearDetail(client.id);
  const counts = checklistCounts(detail.checklist);
  const total = detail.checklist.length;
  const outstanding = detail.checklist.filter((x) => x.status !== "received");
  const hasReview = !readOnly && !!getReview(client.id);

  const sendReminderNow = () => {
    if (!outstanding.length) {
      toast({ tone: "info", title: "Nothing outstanding", description: "Every document on the checklist has been received." });
      return;
    }
    const names = outstanding.map((x) => x.doc.split(" — ")[0]).join(", ");
    actions.sendReminder(client.id, client.channel, `${outstanding.length} item${outstanding.length > 1 ? "s" : ""} outstanding: ${names}`);
    toast({ title: `Reminder sent to ${client.name}`, description: `${client.channel} · ${outstanding.length} item${outstanding.length > 1 ? "s" : ""} outstanding` });
  };

  const cycle = (index) => {
    const item = detail.checklist[index];
    const next = NEXT_STATUS[item.status];
    actions.cycleChecklistItem(client.id, index);
    const allReceived = next === "received" && detail.checklist.every((x, i) => i === index || x.status === "received");
    // Last document in → the AI checks everything before any human sees it.
    if (allReceived && ["new", "waiting", "extension"].includes(groupOf(client))) {
      actions.runAiCheck(client.id);
      toast({ tone: "info", title: "All documents received", description: "The AI document check is running now." });
    }
  };

  return (
    <div className="page">
      <PageHeader breadcrumbs={[{ label: "Clients", href: "/clients" }, { label: client.name }]} />

      <Card pad={false}>
        <div className="client-hero">
          <Avatar name={client.name} size={56} />
          <div className="client-hero-main">
            {readOnly ? (
              <div className="client-hero-name">
                <h1>{client.name}</h1>
              </div>
            ) : (
              <NameEditor client={client} />
            )}
            <div className="client-hero-meta">
              <span>
                <span className="tag">{client.type}</span> {RETURN_TYPE_LABELS[client.type]}
              </span>
              <span>{client.filingStatus}</span>
              <span>
                <Mail size={14} aria-hidden /> {client.email}
              </span>
              <span>
                <Phone size={14} aria-hidden /> {client.phone}
              </span>
            </div>
          </div>
          {readOnly ? (
            <div className="client-hero-side">
              <div className="hero-field">
                <span className="hero-field-label">Tax year {taxYear}</span>
                <StatusBadge status={client.status} showSource compact={false} />
              </div>
              <div className="hero-field">
                <span className="hero-field-label">Filed</span>
                <span style={{ fontWeight: 600 }}>
                  {client.filedOn} {client.extended && <Badge tone="warning">On extension</Badge>}
                </span>
              </div>
              <div className="hero-field">
                <span className="hero-field-label">Preparer</span>
                <span className="ct-client" style={{ gap: 8, fontWeight: 600 }}>
                  <Avatar name={client.assignee} size={22} />
                  {client.assignee}
                </span>
              </div>
            </div>
          ) : (
          <div className="client-hero-side">
            <div className="hero-field">
              <span className="hero-field-label">Status</span>
              <Select
                value={client.status}
                options={STATUS_OPTIONS}
                renderValue={(o) => <StatusBadge status={o.value} showSource compact={false} />}
                onChange={(v) => {
                  actions.setStatus(client.id, v);
                  toast({ title: `Status changed to ${statusMeta(v).label}`, description: "Synced to ProConnect." });
                }}
                ariaLabel="Status"
                menuWidth={300}
                align="end"
              />
            </div>
            <div className="hero-field">
              <span className="hero-field-label">Assignee</span>
              <Select
                value={client.assignee}
                options={ASSIGNEES.map((a) => ({ value: a, label: a, render: <><Avatar name={a} size={20} />{a}</> }))}
                renderValue={(o) => <><Avatar name={o.value} size={22} />{o.label}</>}
                onChange={(v) => {
                  actions.setAssignee(client.id, v);
                  toast({ title: `Reassigned to ${v}` });
                }}
                ariaLabel="Assignee"
                menuWidth={200}
              />
            </div>
            {hasReview && (
              <Button variant="secondary" icon={Sparkles} href={`/review/${client.id}`}>
                AI summary
              </Button>
            )}
            <Button icon={Send} onClick={sendReminderNow}>
              Send reminder now
            </Button>
          </div>
          )}
        </div>
      </Card>

      <div className="detail-grid">
        <div className="stack">
          {!readOnly && <AiCheckCard client={client} />}
          <Card
            title="Document checklist"
            subtitle={
              readOnly
                ? `All ${total} documents received for tax year ${taxYear}`
                : `${counts.received} of ${total} received · built from last year's return and this year's intake`
            }
            actions={<AIBadge />}
          >
            <div className="checklist-summary">
              <ProgressBar
                label="Checklist progress"
                segments={[
                  { value: counts.received, tone: "success", label: "Received" },
                  { value: counts.pending, tone: "warning", label: "Pending" },
                  { value: counts.missing, tone: "danger", label: "Missing" },
                ]}
              />
              <span className="checklist-pct">{total ? Math.round((counts.received / total) * 100) : 0}%</span>
            </div>
            <div className="count-pills" style={{ marginBottom: 8 }}>
              <Badge tone="success">{counts.received} received</Badge>
              <Badge tone="warning">{counts.pending} pending</Badge>
              <Badge tone="danger">{counts.missing} missing</Badge>
            </div>
            <div className="checklist">
              {detail.checklist.map((item, i) => {
                const Icon = STATUS_ICON[item.status];
                return (
                  <div key={item.doc + i} className={cx("check-item", item.status === "received" && "is-received")}>
                    <span className={cx("check-icon", item.status)}>
                      <Icon size={16} aria-hidden />
                    </span>
                    <div className="check-text">
                      <div className="check-doc">{item.doc}</div>
                      <div className="check-note">{item.note}</div>
                    </div>
                    {readOnly ? (
                      <span className="badge badge-success" style={{ textTransform: "capitalize" }}>
                        {item.status}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={cx("badge", "status-toggle", `badge-${item.status === "received" ? "success" : item.status === "pending" ? "warning" : "danger"}`)}
                        onClick={() => cycle(i)}
                        aria-label={`${item.doc}: ${item.status}. Click to mark as ${NEXT_STATUS[item.status]}.`}
                        title={`Mark as ${NEXT_STATUS[item.status]}`}
                      >
                        {item.status}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!readOnly && (
              <div className="hint" style={{ marginTop: 16 }}>
                <MousePointerClick size={14} aria-hidden /> Click a status to cycle missing → pending → received
              </div>
            )}
          </Card>

          <ProfileCard client={client} readOnly={readOnly} />

          <Card title="Prior-year summary" subtitle="Pulled from last season's return">
            <div className="kv-list">
              {Object.entries(detail.priorYear).map(([k, v]) => (
                <div key={k} className="kv">
                  <span className="kv-k">{k}</span>
                  <span className="kv-v">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <ChatCard key={taxYear} client={client} chat={detail.chat} outstanding={outstanding} readOnly={readOnly} taxYear={taxYear} />
      </div>
    </div>
  );
}

function NameEditor({ client }) {
  const { actions } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(client.name);

  const save = () => {
    const name = draft.trim();
    if (name && name !== client.name) {
      actions.updateClient(client.id, { name });
      toast({ title: "Client name updated" });
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="inline-edit">
        <input
          className="input"
          value={draft}
          autoFocus
          aria-label="Client name"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <Button size="sm" icon={Check} onClick={save} aria-label="Save name" />
        <Button size="sm" variant="ghost" icon={X} onClick={() => setEditing(false)} aria-label="Cancel" />
      </div>
    );
  }
  return (
    <div className="client-hero-name">
      <h1>{client.name}</h1>
      <button
        type="button"
        className="icon-btn edit-pencil"
        onClick={() => {
          setDraft(client.name);
          setEditing(true);
        }}
        aria-label="Edit client name"
        title="Edit name"
      >
        <Pencil size={15} />
      </button>
    </div>
  );
}

function ProfileCard({ client, readOnly }) {
  const { actions } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const start = () => {
    setForm({ name: client.name, filingStatus: client.filingStatus, email: client.email, phone: client.phone, channel: client.channel });
    setEditing(true);
  };
  const save = () => {
    if (!form.name.trim()) return;
    actions.updateClient(client.id, { ...form, name: form.name.trim() });
    setEditing(false);
    toast({ title: "Client profile saved", description: "Changes are kept in this browser." });
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  return (
    <Card
      title="Client profile"
      subtitle="Contact details used for reminders"
      actions={
        readOnly ? null : editing ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" icon={Check} onClick={save} disabled={!form?.name.trim()}>
              Save
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" icon={Pencil} onClick={start}>
            Edit
          </Button>
        )
      }
    >
      {editing ? (
        <div className="form-grid">
          <Field label="Name" htmlFor="pf-name" className="span-2" error={!form.name.trim() ? "Name is required" : null}>
            <input id="pf-name" className="input" value={form.name} onChange={set("name")} autoFocus />
          </Field>
          <Field label="Filing status">
            <Select value={form.filingStatus} options={FILING_STATUSES} onChange={set("filingStatus")} ariaLabel="Filing status" />
          </Field>
          <Field label="Preferred channel">
            <Segmented block value={form.channel} onChange={set("channel")} options={["Email", "SMS"]} ariaLabel="Preferred channel" />
          </Field>
          <Field label="Email" htmlFor="pf-email">
            <input id="pf-email" className="input" type="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" htmlFor="pf-phone">
            <input id="pf-phone" className="input" type="tel" value={form.phone} onChange={set("phone")} />
          </Field>
        </div>
      ) : (
        <div className="kv-list">
          {[
            ["Name", client.name],
            ["Filing status", client.filingStatus],
            ["Email", client.email],
            ["Phone", client.phone],
            ["Preferred channel", client.channel],
          ].map(([k, v]) => (
            <div key={k} className="kv">
              <span className="kv-k">{k}</span>
              <span className="kv-v">{v}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ChatCard({ client, chat, outstanding, readOnly, taxYear }) {
  const { actions } = useStore();
  const toast = useToast();
  const [channel, setChannel] = useState(client.channel === "SMS" ? "SMS" : "Email");
  const [text, setText] = useState("");
  const logRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [chat.length]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [text]);

  const first = client.type === "1040" ? client.name.split(" ")[0] : client.name;
  const quickReplies = [
    { label: "Request missing docs", text: reminderTemplate(client, outstanding) },
    { label: "Thanks — received", text: `Thanks ${first}! We received your documents and will be in touch if we need anything else.` },
    { label: "Ready to sign", text: `Hi ${first}, your return is ready! Please review and e-sign Form 8879 in your portal.` },
  ];

  const send = () => {
    const msg = text.trim();
    if (!msg) return;
    actions.sendMessage(client.id, msg, channel);
    setText("");
    toast({ title: `Message sent by ${channel}`, description: `To ${client.name}` });
  };

  return (
    <Card
      className="chat-card"
      pad={false}
      title="Communication log"
      subtitle={readOnly ? `Tax year ${taxYear} · archived` : `${chat.length} entries · prefers ${client.channel}`}
      actions={<Badge tone="neutral">{client.channel === "SMS" ? client.phone : "Email"}</Badge>}
    >
      <div className="chat-log" ref={logRef} style={{ marginTop: 16 }} aria-live="polite">
        {chat.map((m, i) => (
          <div key={i} className={cx("msg", m.from)}>
            <div className="msg-bubble">{m.text}</div>
            <div className="msg-meta">
              {m.from === "ai" && <SourceTag source="ai" compact />}
              {m.from === "client" && <span>{client.type === "1040" ? client.name.split(" ")[0] : "Client"} ·</span>}
              {m.from === "firm" && (m.auto ? <><SourceTag source="ai" compact /><span>Sent automatically ·</span></> : <span>JB Taxes ·</span>)}
              {m.channel && (
                <>
                  {m.channel === "SMS" ? <MessageSquare size={11} aria-hidden /> : <Mail size={11} aria-hidden />}
                  <span>{m.channel} ·</span>
                </>
              )}
              <span>{fmtDateTime(m.time)}</span>
            </div>
          </div>
        ))}
      </div>
      {readOnly ? (
        <div className="composer">
          <div className="hint">
            <Archive size={14} aria-hidden /> This season is closed — switch to the current tax year to message {client.name}.
          </div>
        </div>
      ) : (
      <div className="composer">
        <div className="composer-top">
          <Segmented
            size="sm"
            value={channel}
            onChange={setChannel}
            ariaLabel="Send as"
            options={[
              { value: "SMS", label: "SMS", icon: MessageSquare },
              { value: "Email", label: "Email", icon: Mail },
            ]}
          />
          <div className="quick-replies">
            {quickReplies.map((r) => (
              <button
                key={r.label}
                type="button"
                className="quick-reply"
                onClick={() => {
                  setText(r.text);
                  inputRef.current?.focus();
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="composer-box">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            placeholder={`Message ${client.name} by ${channel}…`}
            aria-label="Message"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button size="sm" icon={Send} onClick={send} disabled={!text.trim()}>
            Send
          </Button>
        </div>
        <div className="hint">Enter to send · Shift + Enter for a new line</div>
      </div>
      )}
    </Card>
  );
}
