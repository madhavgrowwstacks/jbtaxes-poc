"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  Check,
  CheckCircle2,
  CreditCard,
  FileUp,
  Lock,
  RotateCcw,
  Signal,
  Sparkles,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import ClosedSeasonNotice from "../../components/ClosedSeasonNotice";
import { useStore } from "../../components/store";
import { AIBadge, Badge, Button, Card, Field, Segmented } from "../../components/ui";
import { INTAKE } from "../../lib/data";
import { cx } from "../../lib/utils";

const STEPS = ["Welcome", "Your details", "What changed", "Documents", "Deposit"];
const FIELD_DEFS = [
  { key: "legalName", label: "Legal name", type: "text", autoComplete: "name" },
  { key: "filingStatus", label: "Filing status", type: "select" },
  { key: "address", label: "Home address", type: "text", autoComplete: "street-address" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Mobile phone", type: "tel", autoComplete: "tel" },
  { key: "dependents", label: "Number of dependents", type: "number" },
];
const PERSONAL_STATUSES = ["Single", "Married filing jointly", "Married filing separately", "Head of household", "Qualifying surviving spouse"];
const NEW_CLIENT_DOCS = ["Photo ID (driver's license or passport)", "W-2s and 1099s for 2025", "Last year's tax return (if you have it)"];

const STAFF_NOTES = [
  { step: 0, title: "Pre-filled from last year", text: "Returning clients start with last season's details and document list — no retyping." },
  { step: 1, title: "Confirm, don't re-enter", text: "Clients only touch what changed. Edits are highlighted for the preparer." },
  { step: 2, title: "Branching questions", text: "Follow-ups appear only when a client answers Yes — no 40-question forms." },
  { step: 3, title: "Builds the AI checklist", text: "Every Yes adds the right documents to the client's checklist automatically." },
  { step: 4, title: "Deposit stops no-shows", text: "$50 for returning clients, $100 for new — credited to the final invoice." },
];

const digits = (v) => v.replace(/\D/g, "");
const fmtCard = (v) => digits(v).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const fmtExp = (v) => {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
};
const cardBrand = (num) => {
  const d = digits(num);
  if (/^4/.test(d)) return "VISA";
  if (/^5[1-5]/.test(d)) return "MASTERCARD";
  if (/^3[47]/.test(d)) return "AMEX";
  if (/^6/.test(d)) return "DISCOVER";
  return null;
};
const luhn = (num) => {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

function freshState(mode) {
  const src = mode === "returning" ? INTAKE.returning : INTAKE.newClient;
  return {
    step: 0,
    fields: { ...src.fields },
    answers: { ...src.answers },
    branch: mode === "returning" ? { business: { "Business name": "Mitchell Design Studio", "Approx. 1099-NEC income": "$12,400", "Main business expenses": "" } } : {},
    uploads: {},
    card: { name: "", number: "", exp: "", cvc: "", zip: "" },
    errors: {},
    receipt: null,
  };
}

export default function IntakePage() {
  const { actions, isArchived } = useStore();
  const [mode, setMode] = useState("returning");
  const [s, setS] = useState(() => freshState("returning"));
  const [uploading, setUploading] = useState(null);
  const [paying, setPaying] = useState(false);
  const bodyRef = useRef(null);

  const src = mode === "returning" ? INTAKE.returning : INTAKE.newClient;
  const deposit = mode === "returning" ? INTAKE.deposit.returning : INTAKE.deposit.newClient;
  const firstName = (s.fields.legalName || src.name || "").split(" ")[0];
  const patch = (p) => setS((prev) => ({ ...prev, ...p }));
  const go = (step) => patch({ step, errors: {} });

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [s.step]);

  if (isArchived) {
    return (
      <ClosedSeasonNotice pageTitle="Intake forms" title="Intake for tax year {year} is closed">
        New intakes always go into the current season ({INTAKE.year}).
      </ClosedSeasonNotice>
    );
  }

  const switchMode = (m) => {
    setMode(m);
    setS(freshState(m));
  };

  // Documents the client is asked for, based on last year + their answers.
  const docs = [
    ...(mode === "returning" ? src.lastYearDocs.map((d) => ({ name: d, why: "From last year" })) : NEW_CLIENT_DOCS.map((d) => ({ name: d, why: "Required for all new clients" }))),
    ...INTAKE.lifeChanges.filter((lc) => s.answers[lc.key] === "Yes").flatMap((lc) => lc.docs.map((d) => ({ name: d, why: `Because you said Yes: “${lc.q}”`, isNew: true }))),
  ];
  const uploadedCount = docs.filter((d) => s.uploads[d.name]).length;

  // ---- step validation ----
  const nextFromDetails = () => {
    const e = {};
    if (!s.fields.legalName.trim()) e.legalName = "Please enter your legal name";
    if (!s.fields.filingStatus) e.filingStatus = "Choose a filing status";
    if (!/^\S+@\S+\.\S+$/.test(s.fields.email)) e.email = "Enter a valid email";
    if (digits(s.fields.phone).length < 10) e.phone = "Enter a 10-digit phone number";
    if (Object.keys(e).length) return patch({ errors: e });
    go(2);
  };
  const nextFromChanges = () => {
    const missing = INTAKE.lifeChanges.filter((lc) => !s.answers[lc.key]);
    if (missing.length) return patch({ errors: { changes: `Please answer all ${INTAKE.lifeChanges.length} questions` } });
    go(3);
  };

  const fakeUpload = (name) => {
    setUploading(name);
    setTimeout(() => {
      setS((prev) => ({ ...prev, uploads: { ...prev.uploads, [name]: name.split(/[ (]/)[0].replace(/[^A-Za-z0-9-]/g, "") + "_2025.pdf" } }));
      setUploading(null);
    }, 700);
  };

  const pay = () => {
    const c = s.card;
    const e = {};
    const num = digits(c.number);
    const [mm, yy] = c.exp.split(" / ").map(Number);
    const thisYY = new Date().getFullYear() % 100;
    if (!c.name.trim()) e.name = "Enter the name on your card";
    if (num.length !== 16 || !luhn(num)) e.number = "Your card number is invalid";
    if (!mm || mm > 12 || !yy) e.exp = "Enter a valid expiry date";
    else if (yy < thisYY) e.exp = "Your card has expired";
    if (digits(c.cvc).length < 3) e.cvc = "Enter the 3-digit security code";
    if (digits(c.zip).length !== 5) e.zip = "Enter a 5-digit ZIP";
    if (Object.keys(e).length) return patch({ errors: e });

    setPaying(true);
    setTimeout(() => {
      const receipt = {
        amount: deposit,
        brand: cardBrand(num) || "CARD",
        last4: num.slice(-4),
        confirmation: "JB-2025-" + String(Math.floor(1000 + Math.random() * 9000)),
        payment: "pi_" + Math.random().toString(36).slice(2, 14),
      };
      actions.logIntake(s.fields.legalName.trim(), deposit);
      setPaying(false);
      patch({ receipt, step: 5, errors: {} });
    }, 1500);
  };

  const setCard = (k, fmt) => (e) => setS((prev) => ({ ...prev, card: { ...prev.card, [k]: fmt ? fmt(e.target.value) : e.target.value } }));
  const setField = (k) => (e) => setS((prev) => ({ ...prev, fields: { ...prev.fields, [k]: e.target.value } }));
  const setAnswer = (k, v) => setS((prev) => ({ ...prev, answers: { ...prev.answers, [k]: v }, errors: {} }));
  const setBranch = (k, label) => (e) =>
    setS((prev) => ({ ...prev, branch: { ...prev.branch, [k]: { ...prev.branch[k], [label]: e.target.value } } }));

  const brand = cardBrand(s.card.number);
  const cardErr = s.errors.number || s.errors.exp || s.errors.cvc || s.errors.zip;
  const yesAnswers = INTAKE.lifeChanges.filter((lc) => s.answers[lc.key] === "Yes");

  return (
    <div className="page">
      <PageHeader
        title="Intake forms"
        description="Preview exactly what a client sees on their phone. Everything here is interactive."
        actions={
          <Segmented
            value={mode}
            onChange={switchMode}
            ariaLabel="Client type"
            options={[
              { value: "returning", label: "Returning client" },
              { value: "new", label: "New client" },
            ]}
          />
        }
      />

      <div className="intake-layout">
        <aside className="intake-aside">
          <Card title="How this intake works" subtitle="Notes for the JB Taxes team">
            <div className="next-steps" style={{ marginBottom: 0 }}>
              {STAFF_NOTES.map((n) => (
                <div key={n.step} className="next-step" style={{ opacity: s.step === n.step || (s.step === 5 && n.step === 4) ? 1 : 0.55, transition: "opacity .2s" }}>
                  <span className="next-step-n">{n.step + 1}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{n.title}</div>
                    <div>{n.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <div className="phone">
          <div className="phone-screen">
            <div className="phone-notch" aria-hidden />
            <div className="phone-status" aria-hidden>
              <span>9:41</span>
              <span style={{ display: "flex", gap: 5 }}>
                <Signal size={14} />
                <Wifi size={14} />
                <BatteryFull size={16} />
              </span>
            </div>
            <div className="phone-body" ref={bodyRef}>
              <div className="phone-brand">
                <div className="phone-brand-name">
                  JB <span>Taxes</span>
                </div>
                {mode === "returning" && s.step < 5 && (
                  <div style={{ marginTop: 8 }}>
                    <AIBadge>Pre-filled from last year</AIBadge>
                  </div>
                )}
              </div>

              {s.step < 5 && (
                <>
                  <div className="steps" aria-hidden>
                    {STEPS.map((_, i) => (
                      <span key={i} className={i <= s.step ? "is-done" : undefined} />
                    ))}
                  </div>
                  <div className="steps-label">
                    <span>
                      Step {s.step + 1} of {STEPS.length}
                    </span>
                    <span>{STEPS[s.step]}</span>
                  </div>
                </>
              )}

              {/* 0 — Welcome */}
              {s.step === 0 &&
                (mode === "returning" ? (
                  <div>
                    <h2 className="intake-h">Welcome back, {firstName}! Most of this is already done.</h2>
                    <p className="intake-p">
                      We've pre-filled your details and last year's document list. Just confirm what changed and answer a few quick
                      questions — about 3 minutes.
                    </p>
                    <div className="intake-box">
                      <div className="intake-box-label">Last year you provided</div>
                      {src.lastYearDocs.map((d) => (
                        <div key={d} className="intake-doc">
                          <CheckCircle2 size={15} aria-hidden /> {d}
                        </div>
                      ))}
                    </div>
                    <Button block size="lg" iconRight={ArrowRight} onClick={() => go(1)}>
                      Let's start
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h2 className="intake-h">Welcome to JB Taxes</h2>
                    <p className="intake-p">Tell us a little about yourself and your year. It takes about 5 minutes, and you can upload documents now or later.</p>
                    <div className="intake-box">
                      <div className="intake-box-label">Have these handy</div>
                      {NEW_CLIENT_DOCS.map((d) => (
                        <div key={d} className="intake-doc">
                          <CheckCircle2 size={15} aria-hidden /> {d}
                        </div>
                      ))}
                    </div>
                    <Button block size="lg" iconRight={ArrowRight} onClick={() => go(1)}>
                      Get started
                    </Button>
                  </div>
                ))}

              {/* 1 — Details */}
              {s.step === 1 && (
                <div>
                  <h2 className="intake-h">{mode === "returning" ? "Confirm your details" : "Your details"}</h2>
                  <p className="intake-p">{mode === "returning" ? "Update anything that changed since last year." : "We'll use this to set up your account."}</p>
                  <div className="intake-fields">
                    {FIELD_DEFS.map((f) => {
                      const original = src.fields[f.key];
                      const edited = mode === "returning" && s.fields[f.key] !== original;
                      const label = (
                        <>
                          {f.label}
                          {mode === "returning" && original && (
                            <span className={cx("prefill-tag", edited && "is-edited")}>
                              {edited ? "Edited" : <><Check size={11} /> Pre-filled</>}
                            </span>
                          )}
                        </>
                      );
                      return (
                        <Field key={f.key} label={label} htmlFor={`f-${f.key}`} error={s.errors[f.key]}>
                          {f.type === "select" ? (
                            <select id={`f-${f.key}`} className="input" value={s.fields[f.key]} onChange={setField(f.key)}>
                              <option value="">Choose…</option>
                              {PERSONAL_STATUSES.map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`f-${f.key}`}
                              className="input"
                              type={f.type}
                              min={f.type === "number" ? 0 : undefined}
                              autoComplete={f.autoComplete}
                              value={s.fields[f.key]}
                              onChange={setField(f.key)}
                            />
                          )}
                        </Field>
                      );
                    })}
                  </div>
                  <Button block size="lg" iconRight={ArrowRight} onClick={nextFromDetails}>
                    {mode === "returning" ? "Looks right" : "Continue"}
                  </Button>
                </div>
              )}

              {/* 2 — Life changes */}
              {s.step === 2 && (
                <div>
                  <h2 className="intake-h">What changed in {INTAKE.year}?</h2>
                  <p className="intake-p">Answer Yes and we'll ask a couple of follow-ups. No surprises at tax time.</p>
                  {INTAKE.lifeChanges.map((lc) => (
                    <div key={lc.key} className="lc">
                      <div className="lc-q" id={`q-${lc.key}`}>
                        {lc.q}
                      </div>
                      <div className="yn" role="radiogroup" aria-labelledby={`q-${lc.key}`}>
                        {["Yes", "No"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={s.answers[lc.key] === v}
                            className={cx(s.answers[lc.key] === v && "is-on")}
                            onClick={() => setAnswer(lc.key, v)}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      {s.answers[lc.key] === "Yes" && (
                        <div className="branch">
                          <span>
                            <Badge tone="violet" icon={Sparkles}>
                              Follow-up questions added
                            </Badge>
                          </span>
                          {lc.expands.map((label) => (
                            <Field key={label} label={label} htmlFor={`b-${lc.key}-${label}`}>
                              <input
                                id={`b-${lc.key}-${label}`}
                                className="input"
                                placeholder="Type here…"
                                value={s.branch[lc.key]?.[label] || ""}
                                onChange={setBranch(lc.key, label)}
                              />
                            </Field>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {s.errors.changes && (
                    <div className="field-error" style={{ margin: "8px 0" }}>
                      {s.errors.changes}
                    </div>
                  )}
                  <Button block size="lg" iconRight={ArrowRight} onClick={nextFromChanges} style={{ marginTop: 12 }}>
                    Continue
                  </Button>
                </div>
              )}

              {/* 3 — Documents */}
              {s.step === 3 && (
                <div>
                  <h2 className="intake-h">Upload what you have</h2>
                  <p className="intake-p">
                    {uploadedCount} of {docs.length} uploaded. Anything you skip goes on your checklist — we'll send a friendly reminder.
                  </p>
                  {docs.map((d) => {
                    const file = s.uploads[d.name];
                    const busy = uploading === d.name;
                    return (
                      <div key={d.name} className={cx("upload-row", file && "is-done")}>
                        <div className="upload-row-text">
                          {d.name} {d.isNew && <Badge tone="violet">New</Badge>}
                          <div className="upload-row-sub">{file ? `✓ ${file}` : d.why}</div>
                        </div>
                        {file ? (
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={`Remove ${d.name}`}
                            onClick={() =>
                              setS((prev) => {
                                const uploads = { ...prev.uploads };
                                delete uploads[d.name];
                                return { ...prev, uploads };
                              })
                            }
                          >
                            <X size={16} />
                          </button>
                        ) : (
                          <Button size="sm" variant="secondary" icon={busy ? undefined : Upload} loading={busy} onClick={() => fakeUpload(d.name)}>
                            {busy ? "Uploading" : "Upload"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  <Button block size="lg" iconRight={ArrowRight} onClick={() => go(4)} style={{ marginTop: 12 }}>
                    {uploadedCount === docs.length ? "Continue" : "Continue — I'll upload the rest later"}
                  </Button>
                </div>
              )}

              {/* 4 — Deposit */}
              {s.step === 4 && (
                <div>
                  <h2 className="intake-h">Reserve your spot</h2>
                  <p className="intake-p">A small deposit holds your place in our queue and is credited toward your final invoice.</p>
                  <div className="pay-box">
                    <div className="pay-amount">
                      <span style={{ fontWeight: 600 }}>{mode === "returning" ? "Returning-client deposit" : "New-client deposit"}</span>
                      <b>${deposit}.00</b>
                    </div>
                    <Field label="Name on card" htmlFor="cc-name" error={s.errors.name} className="span-2">
                      <input id="cc-name" className="input" autoComplete="cc-name" value={s.card.name} onChange={setCard("name")} placeholder={s.fields.legalName || "Full name"} />
                    </Field>
                    <div className="field" style={{ marginTop: 12 }}>
                      <span className="field-label">Card information</span>
                      <div className={cx("card-input", cardErr && "has-error")}>
                        <div className="card-input-num">
                          <input
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="1234 1234 1234 1234"
                            aria-label="Card number"
                            value={s.card.number}
                            onChange={setCard("number", fmtCard)}
                          />
                          {brand ? <span className="card-brand">{brand}</span> : <CreditCard size={18} className="text-3" aria-hidden />}
                        </div>
                        <div className="card-input-row">
                          <input inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" aria-label="Expiry" value={s.card.exp} onChange={setCard("exp", fmtExp)} />
                          <input inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" aria-label="Security code" value={s.card.cvc} onChange={setCard("cvc", (v) => digits(v).slice(0, 4))} />
                          <input inputMode="numeric" autoComplete="postal-code" placeholder="ZIP" aria-label="ZIP code" value={s.card.zip} onChange={setCard("zip", (v) => digits(v).slice(0, 5))} />
                        </div>
                      </div>
                      {cardErr && <div className="field-error">{cardErr}</div>}
                    </div>
                    <div className="stripe-note">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Lock size={12} aria-hidden /> Secured by <b>stripe</b>
                      </span>
                      <button
                        type="button"
                        className="link-btn"
                        style={{ fontSize: 12 }}
                        onClick={() =>
                          patch({
                            card: { name: s.fields.legalName || "Test Client", number: "4242 4242 4242 4242", exp: "12 / 29", cvc: "123", zip: "97201" },
                            errors: {},
                          })
                        }
                      >
                        Use test card
                      </button>
                    </div>
                  </div>
                  <Button block size="lg" className="btn-stripe" loading={paying} onClick={pay}>
                    {paying ? "Processing…" : `Pay $${deposit} & submit`}
                  </Button>
                  <p className="text-3" style={{ fontSize: 12, textAlign: "center", marginTop: 10 }}>
                    Test mode — no real card is charged.
                  </p>
                </div>
              )}

              {/* 5 — Success */}
              {s.step === 5 && s.receipt && (
                <div className="success-wrap">
                  <div className="success-check">
                    <Check size={36} strokeWidth={3} />
                  </div>
                  <h2 className="intake-h">You're all set{firstName ? `, ${firstName}` : ""}!</h2>
                  <p className="intake-p" style={{ marginBottom: 0 }}>
                    Your spot in our {INTAKE.year} queue is reserved. A receipt is on its way to {s.fields.email || "your inbox"}.
                  </p>
                  <div className="receipt kv-list">
                    <div className="kv" style={{ paddingTop: 10 }}>
                      <span className="kv-k">Amount paid</span>
                      <span className="kv-v">${s.receipt.amount}.00</span>
                    </div>
                    <div className="kv">
                      <span className="kv-k">Card</span>
                      <span className="kv-v">
                        {s.receipt.brand} •••• {s.receipt.last4}
                      </span>
                    </div>
                    <div className="kv">
                      <span className="kv-k">Confirmation</span>
                      <span className="kv-v">{s.receipt.confirmation}</span>
                    </div>
                    <div className="kv" style={{ paddingBottom: 10 }}>
                      <span className="kv-k">Documents uploaded</span>
                      <span className="kv-v">
                        {uploadedCount} of {docs.length}
                      </span>
                    </div>
                  </div>
                  <div className="next-steps">
                    {[
                      "We review your documents within 2 business days.",
                      `Your preparer reaches out by ${mode === "returning" ? "text" : "email"} only if something's missing.`,
                      "You e-sign online and get a plain-English summary of your return.",
                    ].map((t, i) => (
                      <div key={i} className="next-step">
                        <span className="next-step-n">{i + 1}</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" block icon={RotateCcw} onClick={() => setS(freshState(mode))}>
                    Restart demo
                  </Button>
                </div>
              )}

              {s.step > 0 && s.step < 5 && (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => go(s.step - 1)} disabled={paying}>
                    Back
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="intake-aside intake-aside-right">
          <Card title="What the team receives" subtitle="Updates live as the client fills the form">
            <div className="kv-list">
              <div className="kv">
                <span className="kv-k">Client</span>
                <span className="kv-v">{s.fields.legalName || "—"}</span>
              </div>
              <div className="kv">
                <span className="kv-k">Filing status</span>
                <span className="kv-v">{s.fields.filingStatus || "—"}</span>
              </div>
              <div className="kv">
                <span className="kv-k">Life changes</span>
                <span className="kv-v">{yesAnswers.length ? yesAnswers.map((lc) => lc.short).join(", ") : "None yet"}</span>
              </div>
              <div className="kv">
                <span className="kv-k">Documents</span>
                <span className="kv-v">
                  <FileUp size={13} style={{ verticalAlign: -2 }} aria-hidden /> {uploadedCount} of {docs.length}
                </span>
              </div>
              <div className="kv">
                <span className="kv-k">Deposit</span>
                <span className="kv-v">
                  {s.receipt ? <Badge tone="success">Paid ${s.receipt.amount}</Badge> : <Badge tone="warning">Pending ${deposit}</Badge>}
                </span>
              </div>
            </div>
            {s.receipt && (
              <p className="hint" style={{ marginTop: 16 }}>
                <CheckCircle2 size={14} style={{ color: "var(--success)" }} aria-hidden /> Added to the activity feed and notifications.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
