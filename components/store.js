"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ACTIVITY,
  CLIENT_DETAIL,
  CLIENTS,
  CURRENT_TAX_YEAR,
  NOTIFICATIONS,
  REMINDER_RULES,
  REVIEWS,
  SEASONS,
  buildDefaultDetail,
} from "../lib/data";
import {
  aiCheckResults,
  archivedDetail,
  checklistCounts,
  clientsForYear,
  groupTotals,
  openFlagsFor,
  statusMeta,
  suggestRebalance,
  teamWorkload,
} from "../lib/utils";

// Bump when the shape of the seed data changes so old browsers start fresh.
const STORAGE_KEY = "jbtaxes-demo-v3";
const AI_CHECK_MS = 1600; // how long the simulated AI document check takes

const initialState = () => ({
  taxYear: CURRENT_TAX_YEAR,
  clients: CLIENTS,
  workloadMoves: [], // bulk reassignments between preparers: { from, to, group, n }
  details: {}, // per-client overrides of checklist / chat / prior-year
  reviews: {}, // per-client edits, approvals and sent status for AI summaries
  reminders: REMINDER_RULES,
  activity: ACTIVITY,
  notifications: NOTIFICATIONS,
  chase: { called: {}, resolved: {} },
});

const StoreContext = createContext(null);

function detailFrom(state, id) {
  if (state.details[id]) return state.details[id];
  if (CLIENT_DETAIL[id]) return CLIENT_DETAIL[id];
  const client = state.clients.find((c) => c.id === id);
  return client ? buildDefaultDetail(client) : { priorYear: {}, checklist: [], chat: [] };
}

const NEXT_STATUS = { missing: "pending", pending: "received", received: "missing" };

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Your own actions are grouped into one feed entry per kind ("You sent reminders to 3 clients").
// [icon, actor, label(count)]
const BATCH_KINDS = {
  reminder: ["reminder", "You", (n) => `sent document reminders to ${plural(n, "client")}`],
  message: ["message", "You", (n) => `messaged ${plural(n, "client")}`],
  status: ["check", "You", (n) => `updated the status of ${plural(n, "client")}`],
  assignee: ["user", "You", (n) => `reassigned ${plural(n, "client")}`],
  profile: ["user", "You", (n) => `updated ${plural(n, "client profile")}`],
  received: ["upload", "You", (n) => `marked ${plural(n, "document")} received`],
  call: ["call", "You", (n) => `called ${plural(n, "client")} from the chase queue`],
  review: ["sparkles", "You", (n) => `sent AI summaries to ${plural(n, "client")}`],
  intake: ["payment", "New intakes", (n) => `— ${plural(n, "client")} completed intake and paid a deposit`],
  "ai-passed": ["check", "AI document check", (n) => `passed ${plural(n, "client")} — ready for human review`, "ai"],
  "ai-flagged": ["flag", "AI document check", (n) => `flagged ${plural(n, "client")} and sent them back automatically`, "ai"],
  override: ["user", "You", (n) => `overrode the AI and sent ${plural(n, "client")} to review`],
};
// Kinds where a client appears at most once (latest action wins).
const ONE_PER_CLIENT = new Set(["reminder", "message", "status", "assignee", "profile", "call", "review", "ai-passed", "ai-flagged", "override"]);
const BATCH_WINDOW = 12 * 60 * 60 * 1000;

export function StoreProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      // Storage unavailable or corrupt — fall back to seed data.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota or private mode — edits just won't survive a refresh.
    }
  }, [state, hydrated]);

  const actions = useMemo(() => {
    const newId = () => "a" + Date.now() + Math.random().toString(36).slice(2, 6);
    const pushActivity = (s, entry) => ({ ...s, activity: [{ id: newId(), time: Date.now(), ...entry }, ...s.activity].slice(0, 40) });

    // Adds `item` to today's entry of the same kind, or starts a new one at the top of the feed.
    const logBatch = (s, kind, item) => {
      const [icon, actor, label, source] = BATCH_KINDS[kind];
      const idx = s.activity.findIndex((a) => a.live && a.batch?.kind === kind && typeof a.time === "number" && Date.now() - a.time < BATCH_WINDOW);
      if (idx === -1) {
        return pushActivity(s, { icon, actor, source, text: label(1), live: true, batch: { kind, items: [item] } });
      }
      const prev = s.activity[idx];
      const kept = ONE_PER_CLIENT.has(kind) ? prev.batch.items.filter((i) => i.clientId !== item.clientId) : prev.batch.items;
      const items = [item, ...kept];
      const updated = { ...prev, time: Date.now(), text: label(items.length), batch: { kind, items } };
      return { ...s, activity: [updated, ...s.activity.filter((_, i) => i !== idx)] };
    };
    const clientItem = (s, id, extra) => {
      const c = s.clients.find((x) => x.id === id);
      return { clientId: id, name: c?.name || "Client", type: c?.type, channel: c?.channel, ...extra };
    };

    const patchClient = (s, id, patch) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
    const patchDetail = (s, id, fn) => ({ ...s, details: { ...s.details, [id]: fn(detailFrom(s, id)) } });
    const appendChat = (s, id, msg) => patchDetail(s, id, (d) => ({ ...d, chat: [...d.chat, { time: Date.now(), ...msg }] }));

    return {
      setTaxYear(taxYear) {
        setState((s) => ({ ...s, taxYear }));
      },
      // move: { from, to, group, groupLabel, n }
      rebalance(move) {
        setState((s) =>
          pushActivity(
            { ...s, workloadMoves: [...s.workloadMoves, { from: move.from, to: move.to, group: move.group, n: move.n, id: newId() }] },
            { icon: "user", actor: "You", text: `moved ${move.n} "${move.groupLabel}" returns from ${move.from} to ${move.to}` }
          )
        );
      },
      undoRebalance() {
        setState((s) => ({ ...s, workloadMoves: s.workloadMoves.slice(0, -1) }));
      },
      updateClient(id, patch) {
        setState((s) => logBatch(patchClient(s, id, patch), "profile", clientItem(s, id, { detail: "Profile details updated", status: "Updated" })));
      },
      setStatus(id, status) {
        const meta = statusMeta(status);
        setState((s) => logBatch(patchClient(s, id, { status }), "status", clientItem(s, id, { detail: `Set to ${meta.label}`, status: meta.label, tone: meta.tone })));
      },
      // The AI layer: check the documents, then either pass to human review or send back to the client.
      runAiCheck(id) {
        setState((s) => patchClient(s, id, { status: "ai_checking" }));
        setTimeout(() => {
          setState((s) => {
            const client = s.clients.find((c) => c.id === id);
            if (!client || client.status !== "ai_checking") return s; // someone changed it meanwhile
            const flags = openFlagsFor(id, s.chase.resolved);
            const checks = aiCheckResults(client, detailFrom(s, id), s.chase.resolved);
            if (flags.length) {
              const first = client.type === "1040" ? client.name.split(" ")[0] : client.name;
              let next = patchClient(s, id, { status: "ai_flagged", lastNudge: Date.now(), daysWaiting: 0 });
              next = appendChat(next, id, { from: "ai", text: `AI document check flagged ${plural(flags.length, "issue")}: ${flags.map((f) => f.flag).join(" ")} Sent back to the client automatically.` });
              next = appendChat(next, id, { from: "firm", channel: client.channel, auto: true, text: `Hi ${first}, quick question while we review your documents: ${flags[0].ask}` });
              return logBatch(next, "ai-flagged", clientItem(s, id, { detail: flags[0].flag, status: "Sent back to client" }));
            }
            let next = patchClient(s, id, { status: "ai_verified", daysWaiting: 0 });
            next = appendChat(next, id, { from: "ai", text: `AI document check passed — ${checks.length} of ${checks.length} checks. Status set to AI-verified · ready for review.` });
            return logBatch(next, "ai-passed", clientItem(s, id, { detail: `${detailFrom(s, id).checklist.length} documents verified`, status: "Passed" }));
          });
        }, AI_CHECK_MS);
      },
      // A human overrides an AI flag: clears the flags and moves the client to "ready for review".
      overrideAiFlag(id) {
        setState((s) => {
          const resolved = { ...s.chase.resolved };
          for (const f of openFlagsFor(id, s.chase.resolved)) resolved[f.id] = Date.now();
          let next = patchClient({ ...s, chase: { ...s.chase, resolved } }, id, { status: "ai_verified" });
          next = appendChat(next, id, { from: "system", text: "AI flag overridden by Jasmin — moved to AI-verified · ready for review" });
          return logBatch(next, "override", clientItem(s, id, { detail: "AI flag overridden", status: "Sent to review" }));
        });
      },
      setAssignee(id, assignee) {
        setState((s) => logBatch(patchClient(s, id, { assignee }), "assignee", clientItem(s, id, { detail: `Reassigned to ${assignee}`, status: "Reassigned" })));
      },
      // `summary` is logged as a system line; `message` (if given) is the full text the client received.
      sendReminder(id, channel, summary, message) {
        setState((s) => {
          let next = patchClient(s, id, { lastNudge: Date.now(), channel: channel === "SMS" ? "SMS" : "Email" });
          next = message
            ? appendChat(next, id, { from: "firm", text: message, channel })
            : appendChat(next, id, { from: "system", text: `Reminder sent (${channel})${summary ? ` — ${summary}` : ""}` });
          return logBatch(next, "reminder", clientItem(s, id, { channel, detail: summary || "Custom reminder message", status: "Sent" }));
        });
      },
      sendMessage(id, text, channel) {
        setState((s) => {
          const next = appendChat(patchClient(s, id, { lastNudge: Date.now() }), id, { from: "firm", text, channel });
          return logBatch(next, "message", clientItem(s, id, { channel, detail: text.length > 90 ? text.slice(0, 90) + "…" : text, status: "Sent" }));
        });
      },
      cycleChecklistItem(id, index) {
        setState((s) => {
          const item = detailFrom(s, id).checklist[index];
          const status = NEXT_STATUS[item.status];
          const next = patchDetail(s, id, (d) => ({
            ...d,
            checklist: d.checklist.map((x, i) =>
              i === index ? { ...x, status, note: status === "received" ? "Marked received by Jasmin" : x.note } : x
            ),
          }));
          return status === "received" ? logBatch(next, "received", clientItem(s, id, { detail: item.doc, status: "Received" })) : next;
        });
      },
      markCalled(id) {
        setState((s) =>
          logBatch({ ...s, chase: { ...s.chase, called: { ...s.chase.called, [id]: Date.now() } } }, "call", clientItem(s, id, { detail: "Called from the chase queue", status: "Called" }))
        );
      },
      undoCalled(id) {
        setState((s) => {
          const called = { ...s.chase.called };
          delete called[id];
          return { ...s, chase: { ...s.chase, called } };
        });
      },
      resolveFlag(flagId) {
        setState((s) => ({ ...s, chase: { ...s.chase, resolved: { ...s.chase.resolved, [flagId]: Date.now() } } }));
      },
      reopenFlag(flagId) {
        setState((s) => {
          const resolved = { ...s.chase.resolved };
          delete resolved[flagId];
          return { ...s, chase: { ...s.chase, resolved } };
        });
      },
      updateRule(id, patch) {
        setState((s) => ({ ...s, reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
      },
      addRule(rule) {
        setState((s) => ({ ...s, reminders: [...s.reminders, { id: "r-" + Date.now(), clients: 0, enabled: true, ...rule }] }));
      },
      deleteRule(id) {
        setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }));
      },
      restoreRule(rule, index) {
        setState((s) => {
          const reminders = [...s.reminders];
          reminders.splice(Math.min(index, reminders.length), 0, rule);
          return { ...s, reminders };
        });
      },
      saveReview(id, patch) {
        setState((s) => ({ ...s, reviews: { ...s.reviews, [id]: { ...s.reviews[id], ...patch } } }));
      },
      sendReview(id) {
        setState((s) => {
          let next = { ...s, reviews: { ...s.reviews, [id]: { ...s.reviews[id], sentAt: Date.now() } } };
          next = appendChat(next, id, { from: "system", text: "AI review summary sent to client (Email)" });
          return logBatch(next, "review", clientItem(s, id, { detail: "AI summary emailed to client", status: "Sent" }));
        });
      },
      logIntake(name, amount) {
        setState((s) => {
          const next = logBatch(s, "intake", { name: name || "New client", type: "1040", detail: `$${amount} deposit via Stripe`, status: "Paid" });
          return {
            ...next,
            notifications: [
              { id: "n" + Date.now(), title: `${name || "A new client"} completed intake`, body: `$${amount} deposit received via Stripe`, href: "/", time: Date.now(), read: false },
              ...next.notifications,
            ],
          };
        });
      },
      markNotificationRead(id) {
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
      },
      markAllNotificationsRead() {
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
      },
      reset() {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setState(initialState());
      },
    };
  }, []);

  const value = useMemo(() => {
    const taxYear = SEASONS[state.taxYear] ? state.taxYear : CURRENT_TAX_YEAR;
    const yearClients = clientsForYear(state.clients, taxYear);
    const team = teamWorkload(state.clients, state.workloadMoves);
    return {
      ...state,
      hydrated,
      actions,
      // Live-season workload per preparer, firm-wide totals per status group, next suggested rebalance (or null).
      team,
      totals: groupTotals(team),
      rebalanceSuggestion: suggestRebalance(team),
      aiChecks: (id) => {
        const client = state.clients.find((c) => c.id === id);
        return client ? aiCheckResults(client, detailFrom(state, id), state.chase.resolved) : [];
      },
      // Selected tax season. `isArchived` = a closed, read-only past season.
      taxYear,
      season: SEASONS[taxYear],
      isArchived: taxYear !== CURRENT_TAX_YEAR,
      yearClients,
      getYearClient: (id) => yearClients.find((c) => c.id === id),
      getYearDetail: (id) => {
        const detail = detailFrom(state, id);
        if (taxYear === CURRENT_TAX_YEAR) return detail;
        const client = yearClients.find((c) => c.id === id);
        return client ? archivedDetail(detail, client, taxYear) : detail;
      },
      getClient: (id) => state.clients.find((c) => c.id === id),
      getDetail: (id) => detailFrom(state, id),
      getReview: (id) => {
        const base = REVIEWS[id];
        if (!base) return null;
        const edits = state.reviews[id] || {};
        return {
          ...base,
          ...edits,
          summary: edits.summary ?? base.summary,
          recommendations: edits.recommendations ?? base.recommendations,
          original: { summary: base.summary, recommendations: base.recommendations },
        };
      },
      outstanding: (id) => {
        const d = detailFrom(state, id);
        return d.checklist.filter((x) => x.status !== "received");
      },
      checklistCounts: (id) => checklistCounts(detailFrom(state, id).checklist),
    };
  }, [state, hydrated, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
