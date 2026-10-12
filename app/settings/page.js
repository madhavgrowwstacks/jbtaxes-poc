"use client";
import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useStore } from "../../components/store";
import { Avatar, Badge, Button, Card, Field, Modal, Switch, useToast } from "../../components/ui";

const INTEGRATIONS = [
  { name: "Intuit ProConnect", desc: "Sync clients and prior-year returns", color: "#0077c5", short: "PC" },
  { name: "Stripe", desc: "Collect intake deposits", color: "#635bff", short: "S" },
  { name: "Twilio SMS", desc: "Send text reminders", color: "#f22f46", short: "T" },
  { name: "Anthropic Claude", desc: "Document triage and client summaries", color: "#c96442", short: "AI" },
];

export default function SettingsPage() {
  const { team, actions } = useStore();
  const toast = useToast();
  const [firm, setFirm] = useState({ name: "JB Taxes", phone: "(503) 555-0142", email: "hello@jbtaxes.example", address: "410 SW Alder St, Portland, OR 97204" });
  const [prefs, setPrefs] = useState({ digest: true, risk: true, uploads: false, weekly: true });
  const [confirmReset, setConfirmReset] = useState(false);

  const setF = (k) => (e) => setFirm((f) => ({ ...f, [k]: e.target.value }));
  const setP = (k) => (v) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    toast({ tone: "info", title: v ? "Notification turned on" : "Notification turned off" });
  };

  return (
    <div className="page">
      <PageHeader title="Settings" description="Firm profile, team, notifications and integrations." />

      <div className="settings-grid">
        <div className="stack">
          <Card
            title="Firm profile"
            subtitle="Shown on client emails, texts and intake forms"
            actions={
              <Button size="sm" icon={Check} onClick={() => toast({ title: "Firm profile saved" })}>
                Save
              </Button>
            }
          >
            <div className="form-grid">
              <Field label="Firm name" htmlFor="s-name">
                <input id="s-name" className="input" value={firm.name} onChange={setF("name")} />
              </Field>
              <Field label="Phone" htmlFor="s-phone">
                <input id="s-phone" className="input" value={firm.phone} onChange={setF("phone")} />
              </Field>
              <Field label="Reply-to email" htmlFor="s-email" className="span-2">
                <input id="s-email" className="input" value={firm.email} onChange={setF("email")} />
              </Field>
              <Field label="Office address" htmlFor="s-address" className="span-2">
                <input id="s-address" className="input" value={firm.address} onChange={setF("address")} />
              </Field>
            </div>
          </Card>

          <Card title="Notifications" subtitle="What Jasmin hears about, and when">
            {[
              ["digest", "Morning chase digest", "7:00 AM summary of overnight nudges and calls needed"],
              ["risk", "At-risk alerts", "When a client goes 72 hours without responding"],
              ["uploads", "Every document upload", "Can be noisy at peak season"],
              ["weekly", "Weekly pipeline report", "Mondays — progress by preparer and status"],
            ].map(([k, t, d]) => (
              <div key={k} className="setting-row">
                <div>
                  <div className="setting-title">{t}</div>
                  <div className="setting-desc">{d}</div>
                </div>
                <Switch checked={prefs[k]} onChange={setP(k)} label={t} />
              </div>
            ))}
          </Card>
        </div>

        <div className="stack">
          <Card title="Team" subtitle={`${team.length} preparers · active returns vs. capacity`}>
            {team.map((p) => (
              <div key={p.name} className="setting-row">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar name={p.name} size={36} />
                  <div>
                    <div className="setting-title">{p.name}</div>
                    <div className="setting-desc">
                      {p.role} · capacity {p.capacity}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Badge tone="neutral">{p.active} active</Badge>
                  <Badge tone={p.status.tone}>{p.status.label}</Badge>
                </div>
              </div>
            ))}
          </Card>

          <Card title="Integrations" subtitle="Mocked in this prototype — nothing connects to live systems">
            {INTEGRATIONS.map((i) => (
              <div key={i.name} className="setting-row">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="integration-logo" style={{ background: i.color }}>
                    {i.short}
                  </span>
                  <div>
                    <div className="setting-title">{i.name}</div>
                    <div className="setting-desc">{i.desc}</div>
                  </div>
                </div>
                <Badge tone="warning">Prototype</Badge>
              </div>
            ))}
          </Card>

          <Card title="Sample data" subtitle="Edits you make are saved in this browser only">
            <div className="setting-row">
              <div>
                <div className="setting-title">Reset the demo</div>
                <div className="setting-desc">Restores every client, checklist, message and rule to the original sample data.</div>
              </div>
              <Button variant="danger" size="sm" icon={RotateCcw} onClick={() => setConfirmReset(true)}>
                Reset
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        size="sm"
        title="Reset sample data?"
        description="All edits — statuses, messages, checklist changes, reminder rules, selected tax year — will be cleared."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)} data-autofocus>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={RotateCcw}
              onClick={() => {
                actions.reset();
                setConfirmReset(false);
                toast({ title: "Sample data restored" });
              }}
            >
              Reset everything
            </Button>
          </>
        }
      />
    </div>
  );
}
