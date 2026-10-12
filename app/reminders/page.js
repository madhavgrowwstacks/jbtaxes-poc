"use client";
import { useState } from "react";
import { BellRing, CalendarClock, Lightbulb, Plus, Trash2, Users } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useStore } from "../../components/store";
import { Badge, Button, Card, EmptyState, Field, Modal, Segmented, Select, Switch, useToast } from "../../components/ui";
import { CADENCES, CHANNELS } from "../../lib/data";
import { addDays, cx, fmtDate } from "../../lib/utils";

const LEAD_DAYS = 21; // first nudge goes out three weeks before the segment's deadline
const CADENCE_OPTIONS = CADENCES.map((c) => ({ value: c, label: `Every ${c} days` }));
const BLANK = { name: "", description: "", deadline: "2027-03-01", channel: "Email", cadence: 7, clients: "" };

const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function RemindersPage() {
  const { reminders, actions } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  const active = reminders.filter((r) => r.enabled);
  const covered = active.reduce((a, r) => a + Number(r.clients || 0), 0);
  const upcoming = active
    .map((r) => ({ rule: r, first: addDays(r.deadline, -LEAD_DAYS) }))
    .sort((a, b) => a.first - b.first);
  const next = upcoming[0];

  const toggle = (r, enabled) => {
    actions.updateRule(r.id, { enabled });
    toast({ tone: enabled ? "success" : "info", title: `${r.name}: reminders ${enabled ? "on" : "paused"}` });
  };
  const remove = (r) => {
    const index = reminders.findIndex((x) => x.id === r.id);
    actions.deleteRule(r.id);
    toast({ tone: "info", title: "Rule deleted", description: r.name, action: { label: "Undo", onClick: () => actions.restoreRule(r, index) } });
  };
  const addRule = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Give this segment a name";
    if (!form.deadline) e.deadline = "Pick a deadline";
    if (Object.keys(e).length) return setErrors(e);
    actions.addRule({ ...form, name: form.name.trim(), description: form.description.trim() || "Custom segment", clients: Number(form.clients) || 0 });
    toast({ title: "Reminder rule added", description: `${form.name.trim()} · first nudge ${fmtDate(toISO(addDays(form.deadline, -LEAD_DAYS)))}` });
    setOpen(false);
  };

  return (
    <div className="page">
      <PageHeader
        title="Reminders"
        description="Segmented reminder rules for the 2027 filing season — each type of client gets its own deadline and rhythm."
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setForm(BLANK);
              setErrors({});
              setOpen(true);
            }}
          >
            Add rule
          </Button>
        }
      />

      <div className="stat-grid">
        <Card pad={false}>
          <div className="stat-card">
            <span className="stat-icon" style={{ background: "var(--info-bg)", color: "var(--info)" }}>
              <BellRing size={20} />
            </span>
            <div>
              <div className="stat-value">
                {active.length}
                <span className="text-3" style={{ fontSize: 16, fontWeight: 500 }}> / {reminders.length}</span>
              </div>
              <div className="stat-label">Rules switched on</div>
            </div>
          </div>
        </Card>
        <Card pad={false}>
          <div className="stat-card">
            <span className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
              <Users size={20} />
            </span>
            <div>
              <div className="stat-value">{covered.toLocaleString()}</div>
              <div className="stat-label">Clients covered by active rules</div>
            </div>
          </div>
        </Card>
        <Card pad={false}>
          <div className="stat-card">
            <span className="stat-icon" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
              <CalendarClock size={20} />
            </span>
            <div>
              <div className="stat-value">{next ? next.first.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</div>
              <div className="stat-label">{next ? `Next send · ${next.rule.name}` : "No active rules"}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        pad={false}
        title="Reminder rules"
        subtitle={`Nudges start ${LEAD_DAYS} days before each deadline and repeat until the documents arrive.`}
      >
        <div style={{ marginTop: 16 }}>
          {reminders.length === 0 ? (
            <EmptyState icon={BellRing} title="No reminder rules" action={<Button icon={Plus} onClick={() => setOpen(true)}>Add rule</Button>}>
              Add a segment to start nudging clients automatically.
            </EmptyState>
          ) : (
            <>
              <div className="rule-head" aria-hidden>
                <span style={{ width: 38 }} />
                <span>Segment</span>
                <span>Docs due by</span>
                <span>Channel</span>
                <span>Cadence</span>
                <span style={{ width: 32 }} />
              </div>
              <div className="rule-list" style={{ borderTop: "1px solid var(--border)" }}>
                {reminders.map((r) => (
                  <div key={r.id} className={cx("rule", !r.enabled && "is-off")}>
                    <Switch checked={r.enabled} onChange={(v) => toggle(r, v)} label={`Enable reminders for ${r.name}`} />
                    <div className="rule-main">
                      <div className="rule-name">
                        {r.name}
                        <Badge tone="neutral">{Number(r.clients).toLocaleString()} clients</Badge>
                        {!r.enabled && <Badge tone="warning">Paused</Badge>}
                      </div>
                      <div className="rule-desc">{r.description}</div>
                    </div>
                    <div className="rule-fields">
                      <label className="rule-field">
                        <span className="rule-field-label">Docs due by</span>
                        <input
                          type="date"
                          className="input"
                          value={r.deadline}
                          onChange={(e) => e.target.value && actions.updateRule(r.id, { deadline: e.target.value })}
                          aria-label={`Deadline for ${r.name}`}
                        />
                      </label>
                      <div className="rule-field">
                        <span className="rule-field-label">Channel</span>
                        <Select size="sm" value={r.channel} options={CHANNELS} onChange={(v) => actions.updateRule(r.id, { channel: v })} ariaLabel={`Channel for ${r.name}`} />
                      </div>
                      <div className="rule-field">
                        <span className="rule-field-label">Cadence</span>
                        <Select
                          size="sm"
                          value={r.cadence}
                          options={CADENCE_OPTIONS}
                          onChange={(v) => actions.updateRule(r.id, { cadence: v })}
                          ariaLabel={`Cadence for ${r.name}`}
                        />
                      </div>
                    </div>
                    <div className="rule-actions">
                      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(r)} aria-label={`Delete ${r.name}`} title="Delete rule" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="two-col" style={{ marginTop: 24 }}>
        <Card title="Upcoming sends" subtitle="First nudge for each active segment">
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing scheduled">Switch on a rule to schedule reminders.</EmptyState>
          ) : (
            <div className="timeline">
              {upcoming.map(({ rule, first }) => {
                const sends = Math.floor(LEAD_DAYS / rule.cadence) + 1;
                return (
                  <div key={rule.id} className="timeline-item">
                    <div className="date-chip">
                      <span className="date-chip-m">{first.toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="date-chip-d">{first.getDate()}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{rule.name}</div>
                      <div className="text-2" style={{ fontSize: 13 }}>
                        {rule.channel} to {Number(rule.clients).toLocaleString()} clients · every {rule.cadence} days · up to {sends} nudges before{" "}
                        {fmtDate(rule.deadline)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Why segment reminders?" subtitle="One generic blast gets ignored">
          <div className="next-steps" style={{ marginBottom: 0 }}>
            {[
              ["EIC filers want their refund early", "Start them first, by SMS, every 3 days."],
              ["Schedule C clients need lead time", "Expense summaries take longer to pull together than a W-2."],
              ["Partnership K-1s block other returns", "Partners can't file until the 1065 is done — push those early."],
              ["Simple W-2 returns need a light touch", "Fewer, gentler nudges keep goodwill with your easiest clients."],
            ].map(([t, d], i) => (
              <div key={t} className="next-step">
                <span className="next-step-n">
                  {i === 0 ? <Lightbulb size={12} /> : i + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>{t}</div>
                  <div>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add reminder rule"
        description="Define a client segment and when their documents are due."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button icon={Plus} onClick={addRule}>
              Add rule
            </Button>
          </>
        }
      >
        <Field label="Segment name" htmlFor="rule-name" error={errors.name}>
          <input
            id="rule-name"
            className="input"
            placeholder="e.g. Clients with foreign accounts"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            data-autofocus
          />
        </Field>
        <Field label="Description" htmlFor="rule-desc">
          <input
            id="rule-desc"
            className="input"
            placeholder="Who's in this segment and why it matters"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>
        <div className="form-grid">
          <Field label="Documents due by" htmlFor="rule-deadline" error={errors.deadline}>
            <input id="rule-deadline" type="date" className="input" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
          </Field>
          <Field label="Clients in segment (est.)" htmlFor="rule-clients">
            <input
              id="rule-clients"
              type="number"
              min={0}
              className="input"
              placeholder="0"
              value={form.clients}
              onChange={(e) => setForm((f) => ({ ...f, clients: e.target.value }))}
            />
          </Field>
          <Field label="Channel" className="span-2">
            <Segmented block value={form.channel} onChange={(v) => setForm((f) => ({ ...f, channel: v }))} options={CHANNELS} ariaLabel="Channel" />
          </Field>
          <Field label="Cadence" className="span-2">
            <Select value={form.cadence} options={CADENCE_OPTIONS} onChange={(v) => setForm((f) => ({ ...f, cadence: v }))} ariaLabel="Cadence" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
