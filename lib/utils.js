import { CHASE, CLIENTS, CLIENT_SINCE, CURRENT_TAX_YEAR, NO_STATUS, PREPARERS, STATUSES, STATUS_GROUPS } from "./data";

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// ---- Statuses ----
const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]));
const GROUP_BY_KEY = Object.fromEntries(STATUS_GROUPS.map((g) => [g.key, g]));
export const groupMeta = (key) => GROUP_BY_KEY[key] || GROUP_BY_KEY.new;
// { key, label, group, source, tone }
export function statusMeta(key) {
  const s = STATUS_BY_KEY[key] || NO_STATUS;
  return { ...s, tone: groupMeta(s.group).tone };
}
export const groupOf = (c) => statusMeta(c.status).group;
// "At risk" isn't a status: it's anyone still waiting on the client after 5+ days.
export const isAtRisk = (c) => groupOf(c) === "waiting" && c.daysWaiting >= 5;

export function initials(name = "") {
  const words = name.replace(/[^A-Za-z0-9 &]/g, "").split(/\s+/).filter((w) => w && w !== "&");
  if (!words.length) return "?";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

const AVATAR_COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0d9488", "#4f46e5"];
export function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// Values are either a display string from the seed data ("2 days ago")
// or a timestamp (number) for anything that happened in this browser.
export function timeAgo(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

export function fmtWhen(v) {
  return typeof v === "number" ? timeAgo(v) : v;
}

export function fmtDateTime(v) {
  if (typeof v !== "number") return v;
  return new Date(v).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// "2027-03-01" -> Date in local time (avoids the UTC off-by-one of new Date(str)).
export function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(iso, opts = { month: "short", day: "numeric" }) {
  if (!iso) return "—";
  return parseISODate(iso).toLocaleDateString("en-US", opts);
}

export function addDays(iso, days) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return d;
}

// ---- Team workload ----
// Bands shown in the workload bars. Filed and inactive returns don't count toward load.
export const LOAD_GROUPS = [
  { key: "client", label: "Waiting on client", groups: ["new", "waiting", "extension"], tone: "warning" },
  { key: "ai", label: "AI-checked, not started", groups: ["ai_check", "ready_review"], tone: "violet" },
  { key: "review", label: "In human review", groups: ["review"], tone: "accent" },
  { key: "finish", label: "Signature & e-file", groups: ["signature", "efile"], tone: "success" },
  { key: "rejected", label: "Rejected", groups: ["rejected"], tone: "danger" },
];
// Returns nobody has started on, in the order the rebalancer hands them over.
const MOVABLE_GROUPS = ["ready_review", "new"];

function countByAssigneeGroup(list) {
  const out = {};
  for (const c of list) {
    out[c.assignee] ??= {};
    const g = groupOf(c);
    out[c.assignee][g] = (out[c.assignee][g] || 0) + 1;
  }
  return out;
}
const INITIAL_BY_ASSIGNEE = countByAssigneeGroup(CLIENTS);

export function loadStatus(ratio) {
  if (ratio > 1.1) return { label: "Overloaded", tone: "danger" };
  if (ratio >= 0.95) return { label: "At capacity", tone: "warning" };
  if (ratio >= 0.7) return { label: "Balanced", tone: "success" };
  return { label: "Has room", tone: "info" };
}

// Firm-wide count per status group for each preparer. Seed numbers are adjusted live by
// whatever changed in the sample clients, plus bulk moves: [{ from, to, group, n }].
export function teamWorkload(clients, moves = []) {
  const live = countByAssigneeGroup(clients);
  return PREPARERS.map((p) => {
    const counts = {};
    for (const g of STATUS_GROUPS) {
      counts[g.key] = p.load[g.key] - (INITIAL_BY_ASSIGNEE[p.name]?.[g.key] || 0) + (live[p.name]?.[g.key] || 0);
    }
    for (const m of moves) {
      if (m.from === p.name) counts[m.group] -= m.n;
      if (m.to === p.name) counts[m.group] += m.n;
    }
    const bands = Object.fromEntries(LOAD_GROUPS.map((b) => [b.key, b.groups.reduce((a, g) => a + Math.max(0, counts[g]), 0)]));
    const active = Object.values(bands).reduce((a, b) => a + b, 0);
    const ratio = active / p.capacity;
    return { ...p, counts, bands, active, filed: counts.filed, ratio, status: loadStatus(ratio) };
  });
}

// Firm-wide totals per status group.
export function groupTotals(team) {
  const out = Object.fromEntries(STATUS_GROUPS.map((g) => [g.key, 0]));
  for (const p of team) for (const g of STATUS_GROUPS) out[g.key] += Math.max(0, p.counts[g.key]);
  return out;
}

// Most-overloaded → most-available, handing over returns nobody has started on yet.
export function suggestRebalance(team) {
  const sorted = [...team].sort((a, b) => b.ratio - a.ratio);
  const from = sorted[0];
  const to = sorted[sorted.length - 1];
  const over = from.active - from.capacity;
  const room = to.capacity - to.active;
  if (over <= 0 || room <= 0 || from === to) return null;
  const group = MOVABLE_GROUPS.find((g) => from.counts[g] > 0);
  if (!group) return null;
  const available = from.counts[group];
  let n = Math.min(over, room, available);
  if (n >= 10 && n !== available) n = Math.floor(n / 5) * 5;
  return { from: from.name, to: to.name, group, groupLabel: groupMeta(group).label, n, over, room };
}

// ---- AI document check ----
export const openFlagsFor = (clientId, resolved = {}) => CHASE.flags.filter((f) => f.clientId === clientId && !resolved[f.id]);

// The checks the AI runs once a client's documents are in. Flags come from the AI triage data.
export function aiCheckResults(client, detail, resolved) {
  const received = detail.checklist.filter((x) => x.status === "received").length;
  const total = detail.checklist.length;
  const flags = openFlagsFor(client.id, resolved);
  return [
    { label: "All requested documents received", result: received === total ? "pass" : "pending", note: `${received} of ${total}` },
    { label: "Documents are legible and complete", result: received ? "pass" : "pending", note: "OCR read every page" },
    { label: "Names and SSN/EIN match the client record", result: received ? "pass" : "pending" },
    { label: "Income forms match last year's sources", result: flags.some((f) => /K-1|EIN|statement/.test(f.flag)) ? "flag" : received ? "pass" : "pending" },
    { label: "Intake answers agree with uploaded documents", result: flags.length ? "flag" : received ? "pass" : "pending" },
  ].map((c) => ({ ...c, note: c.result === "flag" ? flags.map((f) => f.flag).join(" ") : c.note }));
}

// ---- Closed seasons ----
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic filed date for a client in a closed season (same on server and client).
function filedDate(id, year) {
  const h = hash(id + year);
  const extended = h % 6 === 0;
  const d = extended ? new Date(year + 1, 8, 1 + (h % 44)) : new Date(year + 1, 1, 10 + (h % 64));
  return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), extended };
}

export const clientSince = (id) => CLIENT_SINCE[id] || 2020;

// Clients as they stood in a given tax year. Past years: only clients who had joined, all filed.
export function clientsForYear(clients, year) {
  if (year === CURRENT_TAX_YEAR) return clients;
  const y = Number(year);
  return clients
    .filter((c) => clientSince(c.id) <= y)
    .map((c) => {
      const f = filedDate(c.id, y);
      return { ...c, status: "accepted", daysWaiting: 0, lastNudge: "—", filedOn: f.label, extended: f.extended };
    });
}

// Read-only view of a client's record for a closed season.
export function archivedDetail(detail, client, year) {
  const y = Number(year);
  return {
    priorYear: detail.priorYear,
    checklist: detail.checklist.map((x) => ({ ...x, status: "received", note: `Received for tax year ${year}` })),
    chat: [
      { from: "system", text: `Intake form completed for tax year ${year}`, time: `Feb 3, ${y + 1}` },
      { from: "system", text: "All documents received — return moved to review", time: client.extended ? `Aug 19, ${y + 1}` : `Mar 4, ${y + 1}` },
      { from: "firm", text: `Your ${year} return is ready! Please review and e-sign in your portal.`, time: client.extended ? `Sep 2, ${y + 1}` : `Mar 18, ${y + 1}`, channel: client.channel },
      { from: "system", text: `${year} return e-filed and accepted by the IRS${client.extended ? " (on extension)" : ""}`, time: client.filedOn },
    ],
  };
}

export function checklistCounts(checklist) {
  return checklist.reduce(
    (acc, x) => ((acc[x.status] = (acc[x.status] || 0) + 1), acc),
    { received: 0, pending: 0, missing: 0 }
  );
}

export function downloadCSV(filename, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
