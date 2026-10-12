// Mock data for the JB Taxes POC. All fake — no real client data.
// Assignee names are the firm's real preparers from ProConnect.

export const ASSIGNEES = ["Ludy", "Chris Ong", "Ito", "Ajita", "Jasmin Baros"];
export const CURRENT_USER = { name: "Jasmin Baros", role: "Owner · EA", email: "jasmin@jbtaxes.example" };

export const RETURN_TYPES = ["1040", "1120", "1120S", "1065", "1041"];
export const RETURN_TYPE_LABELS = {
  "1040": "Individual",
  "1120": "C corporation",
  "1120S": "S corporation",
  "1065": "Partnership",
  "1041": "Trust / estate",
};

export const FILING_STATUSES = [
  "Single",
  "Married filing jointly",
  "Married filing separately",
  "Head of household",
  "Qualifying surviving spouse",
  "C corporation",
  "S corporation",
  "Partnership",
  "Trust",
  "Estate",
];

// ---- Statuses ----
// Pipeline groups, in workflow order. Every status belongs to one group; KPIs,
// workload and filters work on groups. `active` = counts toward a preparer's load.
export const STATUS_GROUPS = [
  { key: "new", label: "No status yet", tone: "neutral", active: true },
  { key: "waiting", label: "Waiting on client", tone: "warning", active: true },
  { key: "extension", label: "On extension", tone: "warning", active: true },
  { key: "ai_check", label: "AI checking", tone: "violet", active: true },
  { key: "ready_review", label: "Ready for human review", tone: "violet", active: true },
  { key: "review", label: "In human review", tone: "info", active: true },
  { key: "signature", label: "Signature & payment", tone: "info", active: true },
  { key: "efile", label: "Ready to e-file", tone: "info", active: true },
  { key: "rejected", label: "Rejected", tone: "danger", active: true },
  { key: "filed", label: "Filed", tone: "success", active: false },
  { key: "inactive", label: "Inactive", tone: "neutral", active: false },
];

// The AI layer sits between "client sent everything" and "a human reviews".
// These statuses live in the JB Taxes portal only and are set by the AI, never by hand.
export const AI_STATUSES = [
  { key: "ai_checking", label: "AI checking documents", group: "ai_check", source: "ai" },
  { key: "ai_verified", label: "AI-verified · ready for review", group: "ready_review", source: "ai" },
  { key: "ai_flagged", label: "AI flagged · sent back to client", group: "waiting", source: "ai" },
];

// The firm's real ProConnect statuses, in ProConnect's order. Changing one here syncs to ProConnect.
export const PROCONNECT_STATUSES = [
  { key: "accepted", label: "Accepted", group: "filed" },
  { key: "admin_complete", label: "Admin Complete", group: "filed" },
  { key: "efiled", label: "Efiled", group: "filed" },
  { key: "extension_filed", label: "Extension Filed", group: "extension" },
  { key: "review_jas", label: "For Review (Jas)", group: "review" },
  { key: "review_lhudy", label: "For Review (Lhudy)", group: "review" },
  { key: "mailed_entities", label: "Mailed Taxes to Entities", group: "filed" },
  { key: "mailed_rejected", label: "Mailed Taxes Rejected", group: "rejected" },
  { key: "missing_8879", label: "Missing 8879", group: "signature" },
  { key: "need_efile", label: "Need to Efile", group: "efile" },
  { key: "not_processing", label: "Not Processing", group: "inactive" },
  { key: "on_hold", label: "On Hold", group: "inactive" },
  { key: "paid_missing_8879", label: "Paid Missing 8879", group: "signature" },
  { key: "pending_8879", label: "Pending 8879/Invoice", group: "signature" },
  { key: "requested_info", label: "Requested Info", group: "waiting" },
  { key: "rt_filed", label: "RT, FILED", group: "filed" },
  { key: "no_tax_docs", label: "NO TAX DOCS", group: "waiting" },
  { key: "duplicate", label: "DUPLICATE", group: "inactive" },
  { key: "mailed", label: "Mailed", group: "filed" },
  { key: "state_rejected", label: "State Return Rejected", group: "rejected" },
  { key: "rejected", label: "Rejected", group: "rejected" },
  { key: "efiled_payment_due", label: "Efiled Payment Due", group: "filed" },
  { key: "payment_signature", label: "For Payment & Signature", group: "signature" },
].map((s) => ({ ...s, source: "proconnect" }));

// "Clear Status" in ProConnect.
export const NO_STATUS = { key: "none", label: "No status", group: "new", source: "proconnect" };

export const STATUSES = [...AI_STATUSES, ...PROCONNECT_STATUSES, NO_STATUS];

// Firm-wide workload per preparer and status group (including the sample clients).
// `capacity` = active returns a preparer can carry comfortably.
// The 28 sample clients below are a slice of these numbers; when a sample client's
// status or assignee changes, the firm-wide numbers move with it (see lib/utils.js).
export const PREPARERS = [
  { name: "Ludy", role: "Senior preparer", capacity: 140,
    load: { new: 16, waiting: 38, extension: 9, ai_check: 5, ready_review: 14, review: 40, signature: 34, efile: 14, rejected: 6, filed: 170, inactive: 7 } },
  { name: "Chris Ong", role: "Preparer", capacity: 130,
    load: { new: 14, waiting: 36, extension: 8, ai_check: 5, ready_review: 10, review: 30, signature: 26, efile: 11, rejected: 2, filed: 142, inactive: 6 } },
  { name: "Ito", role: "Preparer", capacity: 140,
    load: { new: 12, waiting: 26, extension: 8, ai_check: 5, ready_review: 9, review: 25, signature: 22, efile: 10, rejected: 1, filed: 146, inactive: 5 } },
  { name: "Ajita", role: "Preparer · Business returns", capacity: 130,
    load: { new: 10, waiting: 20, extension: 6, ai_check: 3, ready_review: 7, review: 12, signature: 10, efile: 6, rejected: 0, filed: 96, inactive: 5 } },
  { name: "Jasmin Baros", role: "Owner · EA (also reviews)", capacity: 90,
    load: { new: 12, waiting: 20, extension: 7, ai_check: 4, ready_review: 6, review: 13, signature: 6, efile: 0, rejected: 0, filed: 86, inactive: 6 } },
];

// ---- Tax seasons ----
// The current year is live and editable; earlier years are closed, read-only archives.
export const CURRENT_TAX_YEAR = "2025";
export const TAX_YEARS = [
  { year: "2025", status: "current", note: "Filing now · extensions due Oct 15" },
  { year: "2024", status: "closed", note: "Closed Oct 15, 2025" },
  { year: "2023", status: "closed", note: "Closed Oct 15, 2024" },
];

// Year each sample client joined the firm. Anyone not listed was a client before 2023.
export const CLIENT_SINCE = {
  "priya-raman": 2025,
  "nguyen-trust": 2025,
  "cascade-coffee": 2025,
  "greenline-logistics": 2025,
  "harbor-dental": 2024,
  "willamette-rentals": 2024,
  "rosewood-bakery": 2024,
  "tanya-brooks": 2024,
  "omar-haddad": 2024,
};

export const SEASONS = {
  "2025": {
    capacity: 1600,
    deadlineLabel: "Oct 15 extension deadline",
    daysToDeadline: 3,
  },
  "2024": {
    closed: true,
    closedLabel: "Season closed Oct 15, 2025",
    capacity: 1500,
    filed: 1418,
    kpis: [
      { key: "filed", label: "Returns filed", value: "1,418", icon: "filed", tone: "success", spark: [120, 310, 540, 790, 1010, 1180, 1340, 1418], delta: "+12% vs 2023", dir: "up", good: true },
      { key: "ext", label: "Extensions filed", value: "212", icon: "clock", tone: "warning", spark: [260, 251, 244, 238, 230, 224, 218, 212], delta: "−18 vs 2023", dir: "down", good: true },
      { key: "refund", label: "Avg. refund", value: "$2,140", icon: "refund", tone: "info", spark: [1890, 1925, 1960, 1990, 2030, 2075, 2110, 2140], delta: "+$95 vs 2023", dir: "up", good: true },
      { key: "accept", label: "E-file acceptance", value: "99.2%", icon: "accept", tone: "violet", spark: [98.1, 98.4, 98.5, 98.7, 98.8, 99.0, 99.1, 99.2], delta: "+0.4 pts", dir: "up", good: true },
      { key: "new", label: "New clients", value: "164", icon: "users", tone: "info", spark: [12, 31, 58, 84, 109, 131, 150, 164], delta: "+21 vs 2023", dir: "up", good: true },
      { key: "turnaround", label: "Avg. turnaround", value: "7.1 days", icon: "timer", tone: "neutral", spark: [9.2, 8.9, 8.4, 8.1, 7.8, 7.5, 7.3, 7.1], delta: "−1.3 days", dir: "down", good: true },
    ],
    byType: { "1040": 1102, "1120": 64, "1120S": 118, "1065": 96, "1041": 38 },
    highlights: [
      { id: "h1", icon: "file", actor: "1,418 returns", text: "filed — a new record for the firm", time: "Season total" },
      { id: "h2", icon: "reminder", actor: "Auto-reminders", text: "sent 9,840 nudges; 71% of documents arrived without a phone call", time: "Jan – Oct 2025" },
      { id: "h3", icon: "check", actor: "Busiest week", text: "Apr 7–13 — 236 returns e-filed", time: "April 2025" },
      { id: "h4", icon: "payment", actor: "Deposits", text: "collected from 164 new clients; no-shows fell to 3%", time: "Season total" },
      { id: "h5", icon: "user", actor: "Ludy", text: "filed the most returns of any preparer (402)", time: "Team" },
      { id: "h6", icon: "flag", actor: "6 notices", text: "received from the IRS — all resolved within 30 days", time: "Post-season" },
    ],
  },
  "2023": {
    closed: true,
    closedLabel: "Season closed Oct 15, 2024",
    capacity: 1400,
    filed: 1266,
    kpis: [
      { key: "filed", label: "Returns filed", value: "1,266", icon: "filed", tone: "success", spark: [98, 270, 470, 690, 880, 1050, 1190, 1266], delta: "+9% vs 2022", dir: "up", good: true },
      { key: "ext", label: "Extensions filed", value: "230", icon: "clock", tone: "warning", spark: [251, 249, 246, 241, 238, 236, 233, 230], delta: "−6 vs 2022", dir: "down", good: true },
      { key: "refund", label: "Avg. refund", value: "$2,045", icon: "refund", tone: "info", spark: [1880, 1902, 1930, 1955, 1980, 2005, 2030, 2045], delta: "+$60 vs 2022", dir: "up", good: true },
      { key: "accept", label: "E-file acceptance", value: "98.8%", icon: "accept", tone: "violet", spark: [97.9, 98.1, 98.2, 98.4, 98.5, 98.6, 98.7, 98.8], delta: "+0.3 pts", dir: "up", good: true },
      { key: "new", label: "New clients", value: "143", icon: "users", tone: "info", spark: [10, 27, 50, 73, 95, 114, 131, 143], delta: "+12 vs 2022", dir: "up", good: true },
      { key: "turnaround", label: "Avg. turnaround", value: "8.4 days", icon: "timer", tone: "neutral", spark: [10.1, 9.8, 9.5, 9.2, 9.0, 8.8, 8.6, 8.4], delta: "−0.9 days", dir: "down", good: true },
    ],
    byType: { "1040": 1004, "1120": 55, "1120S": 99, "1065": 81, "1041": 27 },
    highlights: [
      { id: "h1", icon: "file", actor: "1,266 returns", text: "filed across all return types", time: "Season total" },
      { id: "h2", icon: "reminder", actor: "Reminders", text: "were sent by hand — about 30 staff hours a week at peak", time: "Jan – Apr 2024" },
      { id: "h3", icon: "check", actor: "Busiest week", text: "Apr 8–14 — 214 returns e-filed", time: "April 2024" },
      { id: "h4", icon: "flag", actor: "38 free-quote no-shows", text: "led to the new-client deposit policy", time: "Lesson learned" },
      { id: "h5", icon: "user", actor: "Jasmin Baros", text: "hired Ajita to take on business returns", time: "Team" },
    ],
  },
};

// Static trend data for the KPI cards (last 8 weeks).
export const KPI_TRENDS = {
  total: { spark: [980, 1024, 1061, 1102, 1150, 1188, 1209, 1247], delta: "+38 this week", dir: "up", good: true },
  waiting: { spark: [188, 176, 171, 163, 158, 151, 146, 140], delta: "−6 vs last week", dir: "down", good: true },
  ready_review: { spark: [12, 18, 22, 25, 31, 36, 39, 46], delta: "+7 passed AI today", dir: "up", good: true },
  review: { spark: [96, 101, 108, 110, 114, 117, 113, 120], delta: "+7 vs last week", dir: "up", good: true },
  rejected: { spark: [4, 6, 5, 7, 6, 8, 8, 9], delta: "+1 since Friday", dir: "up", good: false },
  filed: { spark: [330, 372, 421, 468, 517, 551, 586, 640], delta: "+54 this week", dir: "up", good: true },
};

const RAW_CLIENTS = [
  { id: "sarah-mitchell", name: "Sarah Mitchell", type: "1040", filingStatus: "Single", assignee: "Ludy", status: "review_lhudy", daysWaiting: 2, lastNudge: "2 days ago", channel: "Email" },
  { id: "david-chen", name: "David Chen", type: "1040", filingStatus: "Married filing jointly", assignee: "Chris Ong", status: "ai_flagged", daysWaiting: 4, lastNudge: "Yesterday", channel: "SMS" },
  { id: "maria-garcia", name: "Maria Garcia", type: "1040", filingStatus: "Head of household", assignee: "Ito", status: "ai_checking", daysWaiting: 1, lastNudge: "Today", channel: "SMS" },
  { id: "flying-tails", name: "Flying Tails Inc", type: "1120", filingStatus: "C corporation", assignee: "Jasmin Baros", status: "requested_info", daysWaiting: 3, lastNudge: "2 days ago", channel: "Email" },
  { id: "james-wilson", name: "James Wilson", type: "1040", filingStatus: "Single", assignee: "Ajita", status: "requested_info", daysWaiting: 5, lastNudge: "5 days ago", channel: "SMS" },
  { id: "shasta-llc", name: "1202 Shasta, LLC", type: "1065", filingStatus: "Partnership", assignee: "Ludy", status: "review_lhudy", daysWaiting: 2, lastNudge: "Today", channel: "Email" },
  { id: "linda-brown", name: "Linda Brown", type: "1040", filingStatus: "Married filing jointly", assignee: "Chris Ong", status: "ai_flagged", daysWaiting: 3, lastNudge: "Yesterday", channel: "SMS" },
  { id: "robert-taylor", name: "Robert Taylor", type: "1040", filingStatus: "Married filing jointly", assignee: "Ito", status: "payment_signature", daysWaiting: 1, lastNudge: "Today", channel: "Email" },
  { id: "aurelio-trust", name: "Aurelio & Rosa Alvarez Trust", type: "1041", filingStatus: "Trust", assignee: "Ajita", status: "ai_flagged", daysWaiting: 4, lastNudge: "2 days ago", channel: "Email" },
  { id: "jennifer-davis", name: "Jennifer Davis", type: "1040", filingStatus: "Single", assignee: "Ludy", status: "pending_8879", daysWaiting: 2, lastNudge: "Today", channel: "SMS" },
  { id: "michael-lee", name: "Michael Lee", type: "1040", filingStatus: "Head of household", assignee: "Chris Ong", status: "requested_info", daysWaiting: 6, lastNudge: "6 days ago", channel: "SMS" },
  { id: "patricia-moore", name: "Patricia Moore", type: "1040", filingStatus: "Single", assignee: "Ito", status: "ai_verified", daysWaiting: 1, lastNudge: "Today", channel: "Email" },
  { id: "20-20-solutions", name: "20 20 Solutions LLC", type: "1120S", filingStatus: "S corporation", assignee: "Jasmin Baros", status: "requested_info", daysWaiting: 3, lastNudge: "Yesterday", channel: "Email" },
  { id: "karen-white", name: "Karen White", type: "1040", filingStatus: "Married filing separately", assignee: "Ajita", status: "missing_8879", daysWaiting: 2, lastNudge: "Today", channel: "SMS" },
  { id: "paul-harris", name: "Paul Harris", type: "1040", filingStatus: "Single", assignee: "Ludy", status: "requested_info", daysWaiting: 4, lastNudge: "2 days ago", channel: "SMS" },
  { id: "betty-clark", name: "Betty Clark", type: "1040", filingStatus: "Qualifying surviving spouse", assignee: "Chris Ong", status: "requested_info", daysWaiting: 5, lastNudge: "5 days ago", channel: "Email" },
  { id: "steven-lewis", name: "Steven Lewis", type: "1040", filingStatus: "Married filing jointly", assignee: "Ito", status: "need_efile", daysWaiting: 1, lastNudge: "Today", channel: "SMS" },
  { id: "amanda-walker", name: "Amanda Walker", type: "1040", filingStatus: "Single", assignee: "Ajita", status: "ai_verified", daysWaiting: 1, lastNudge: "Today", channel: "Email" },
  { id: "harbor-dental", name: "Harbor Point Dental Group PC", type: "1120S", filingStatus: "S corporation", assignee: "Jasmin Baros", status: "review_jas", daysWaiting: 0, lastNudge: "3 days ago", channel: "Email" },
  { id: "nguyen-trust", name: "Nguyen Family Trust", type: "1041", filingStatus: "Trust", assignee: "Ludy", status: "none", daysWaiting: 0, lastNudge: "Not yet", channel: "Email" },
  { id: "cascade-coffee", name: "Cascade Coffee Ventures LLC", type: "1065", filingStatus: "Partnership", assignee: "Chris Ong", status: "ai_checking", daysWaiting: 1, lastNudge: "Yesterday", channel: "Email" },
  { id: "omar-haddad", name: "Omar & Leila Haddad", type: "1040", filingStatus: "Married filing jointly", assignee: "Jasmin Baros", status: "accepted", daysWaiting: 0, lastNudge: "1 week ago", channel: "Email" },
  { id: "greenline-logistics", name: "Greenline Logistics Inc", type: "1120", filingStatus: "C corporation", assignee: "Ito", status: "review_jas", daysWaiting: 2, lastNudge: "Today", channel: "Email" },
  { id: "priya-raman", name: "Priya Raman", type: "1040", filingStatus: "Single", assignee: "Ajita", status: "none", daysWaiting: 0, lastNudge: "Not yet", channel: "SMS" },
  { id: "kevin-obrien", name: "Kevin O'Brien", type: "1040", filingStatus: "Head of household", assignee: "Ludy", status: "state_rejected", daysWaiting: 0, lastNudge: "2 weeks ago", channel: "SMS" },
  { id: "willamette-rentals", name: "Willamette Rentals Partners", type: "1065", filingStatus: "Partnership", assignee: "Jasmin Baros", status: "no_tax_docs", daysWaiting: 5, lastNudge: "3 days ago", channel: "Email" },
  { id: "tanya-brooks", name: "Tanya Brooks", type: "1040", filingStatus: "Single", assignee: "Chris Ong", status: "paid_missing_8879", daysWaiting: 1, lastNudge: "Today", channel: "SMS" },
  { id: "rosewood-bakery", name: "Rosewood Bakery Inc", type: "1120S", filingStatus: "S corporation", assignee: "Ajita", status: "ai_verified", daysWaiting: 1, lastNudge: "2 days ago", channel: "Email" },
];

export const CLIENTS = RAW_CLIENTS.map((c, i) => ({
  email: c.id.replace(/[^a-z0-9]+/g, ".") + "@example.com",
  phone: `(503) 555-${String(1520 + i * 37).slice(-4)}`,
  ...c,
}));

// Detailed checklist + communication log for a handful of clients.
// Every other client gets a generated one from buildDefaultDetail().
export const CLIENT_DETAIL = {
  "sarah-mitchell": {
    priorYear: { "Filing status": "Single", "Prior-year AGI": "$81,400", "Prior-year refund": "$1,240", "Prepared by": "Ludy" },
    checklist: [
      { doc: "W-2 — Acme Corp", status: "received", note: "Uploaded Oct 7" },
      { doc: "1099-DIV — Vanguard", status: "received", note: "Uploaded Oct 7" },
      { doc: "1098 — Wells Fargo (mortgage)", status: "received", note: "Uploaded Oct 8" },
      { doc: "1099-INT — Chase", status: "received", note: "Uploaded Oct 10" },
      { doc: "1095-A — Health Marketplace", status: "received", note: "Uploaded Oct 10" },
      { doc: "Charitable donation receipts", status: "received", note: "Uploaded Oct 10" },
      { doc: "1099-NEC — freelance (new this year)", status: "received", note: "Uploaded Oct 10 · matches intake answer" },
      { doc: "Child care expense records", status: "received", note: "Uploaded Oct 10" },
    ],
    chat: [
      { from: "system", text: "Intake form completed", time: "Oct 6, 9:12 AM" },
      { from: "firm", text: "Hi Sarah! We've received your W-2 and mortgage statement. Still need a few more items — check your portal.", time: "Oct 7, 10:30 AM", channel: "Email" },
      { from: "client", text: "Thanks! Uploading the rest this weekend.", time: "Oct 7, 2:15 PM", channel: "Email" },
      { from: "system", text: "Auto-reminder sent (SMS) — 1099-INT, 1095-A outstanding", time: "Oct 9, 9:00 AM" },
      { from: "client", text: "All uploaded now!", time: "Oct 10, 8:41 PM", channel: "SMS" },
      { from: "ai", text: "AI document check passed — 8 of 8 documents verified. Status set to AI-verified · ready for review.", time: "Oct 10, 8:44 PM" },
      { from: "system", text: "Ludy picked it up — status set to For Review (Lhudy) and synced to ProConnect", time: "Oct 11, 9:15 AM" },
    ],
  },
  "david-chen": {
    priorYear: { "Filing status": "Married filing jointly", "Prior-year AGI": "$142,900", "Prior-year refund": "$2,815", "Prepared by": "Chris Ong" },
    checklist: [
      { doc: "W-2 — Intel Corp (David)", status: "received", note: "Uploaded 4 days ago" },
      { doc: "W-2 — Providence Health (Mei)", status: "received", note: "Uploaded 4 days ago" },
      { doc: "1099-NEC — consulting income", status: "received", note: "Uploaded yesterday · AI flag: not mentioned on intake" },
      { doc: "1098-E — student loan interest", status: "pending", note: "Client says it's coming · SMS reminder tomorrow" },
      { doc: "Business expense summary (Schedule C)", status: "missing", note: "Needed because of the 1099-NEC" },
      { doc: "Dependent care FSA statement", status: "missing", note: "Last reminder: yesterday · SMS" },
    ],
    chat: [
      { from: "system", text: "Intake form completed — answered 'No' to self-employment", time: "Oct 5, 7:48 PM" },
      { from: "ai", text: "AI document check flagged 1 issue: a 1099-NEC was uploaded but intake said no self-employment. Sent back to the client automatically.", time: "Oct 11, 7:02 AM" },
      { from: "firm", text: "Hi David, quick question while we review your documents: we received a 1099-NEC for consulting work, but your intake said no self-employment. Could you confirm, and send a summary of any related business expenses?", time: "Oct 11, 7:02 AM", channel: "SMS", auto: true },
      { from: "client", text: "Oh right, I did a few months of side consulting. Will pull receipts together.", time: "Oct 11, 12:40 PM", channel: "SMS" },
      { from: "system", text: "Auto-reminder sent (SMS) — 1098-E, dependent care FSA outstanding", time: "Oct 11, 9:00 AM" },
    ],
  },
  "flying-tails": {
    priorYear: { "Entity type": "C corporation", "Prior-year revenue": "$1.84M", "Prior-year tax": "$22,610", "Prepared by": "Jasmin Baros" },
    checklist: [
      { doc: "Year-end P&L (QuickBooks export)", status: "received", note: "Uploaded 3 days ago" },
      { doc: "Balance sheet as of Dec 31", status: "received", note: "Uploaded 3 days ago" },
      { doc: "Bank statements — 12 months", status: "pending", note: "11 of 12 received · March missing" },
      { doc: "Payroll reports (941 / 940)", status: "pending", note: "Requested from Gusto admin" },
      { doc: "Fixed asset additions (new grooming vans)", status: "missing", note: "Last reminder: 2 days ago · Email" },
      { doc: "Officer compensation detail", status: "missing", note: "Last reminder: 2 days ago · Email" },
      { doc: "Loan statements — SBA 7(a)", status: "missing", note: "Flagged by AI from prior-year return" },
    ],
    chat: [
      { from: "system", text: "Engagement letter signed", time: "Oct 2, 4:20 PM" },
      { from: "firm", text: "Hi Dana — thanks for the P&L and balance sheet. We still need payroll reports, the van purchase invoices and the SBA loan statement.", time: "Oct 8, 9:45 AM", channel: "Email" },
      { from: "client", text: "Our bookkeeper is out until Wednesday. I'll chase her for payroll.", time: "Oct 8, 1:12 PM", channel: "Email" },
      { from: "system", text: "Auto-reminder sent (Email) — 3 items outstanding", time: "Oct 10, 9:00 AM" },
    ],
  },
  "james-wilson": {
    priorYear: { "Filing status": "Single", "Prior-year AGI": "$58,300", "Prior-year refund": "$612", "Prepared by": "Ajita" },
    checklist: [
      { doc: "W-2 — Fred Meyer", status: "received", note: "Uploaded 9 days ago" },
      { doc: "1099-G — unemployment", status: "missing", note: "No response to 3 reminders" },
      { doc: "1098-T — Portland Community College", status: "missing", note: "No response to 3 reminders" },
      { doc: "Photo ID (expired on file)", status: "missing", note: "Required before e-file" },
    ],
    chat: [
      { from: "system", text: "Intake form completed", time: "Sep 29, 6:05 PM" },
      { from: "firm", text: "Hi James, we still need your 1099-G and 1098-T. Your extension deadline is Oct 15.", time: "Oct 7, 9:00 AM", channel: "SMS" },
      { from: "system", text: "Auto-reminder sent (SMS) — no reply", time: "Oct 9, 9:00 AM" },
      { from: "system", text: "Escalated to call list — no response in 72 hours", time: "Oct 12, 7:00 AM" },
    ],
  },
  "shasta-llc": {
    priorYear: { "Entity type": "Partnership (Form 1065)", "2024 net rental loss": "−$6,475", "2024 ending assets": "$514,281", "Prepared by": "Ludy" },
    checklist: [
      { doc: "Rental income & expense statement (Form 8825 support)", status: "received", note: "Uploaded Oct 6" },
      { doc: "Year-end balance sheet", status: "received", note: "Uploaded Oct 6" },
      { doc: "Mortgage / long-term note statement", status: "received", note: "Uploaded Oct 7" },
      { doc: "Property tax bill", status: "received", note: "Uploaded Oct 7" },
      { doc: "Fixed asset & depreciation schedule", status: "received", note: "From prior year, updated Oct 8" },
      { doc: "Partner details for K-1s", status: "received", note: "Confirmed Oct 8" },
    ],
    chat: [
      { from: "system", text: "Intake form completed", time: "Oct 2, 3:10 PM" },
      { from: "client", text: "All the rental statements and the loan statement are uploaded.", time: "Oct 8, 4:22 PM", channel: "Email" },
      { from: "ai", text: "AI document check passed — 5 of 5 checks. Status set to AI-verified · ready for review.", time: "Oct 8, 4:25 PM" },
      { from: "system", text: "Ludy picked it up — status set to For Review (Lhudy) and synced to ProConnect", time: "Oct 9, 10:02 AM" },
      { from: "ai", text: "AI review summary drafted from the 2025 vs 2024 tax summary — waiting for sign-off", time: "Oct 12, 9:40 AM" },
    ],
  },
  "aurelio-trust": {
    priorYear: { "Entity type": "Irrevocable trust", "Prior-year income": "$96,250", "Distributions": "$40,000", "Prepared by": "Ajita" },
    checklist: [
      { doc: "Trust agreement (on file)", status: "received", note: "From prior year" },
      { doc: "1099-B — Schwab brokerage", status: "received", note: "Uploaded 4 days ago · AI flag: property sale, no basis" },
      { doc: "1099-DIV / 1099-INT — Schwab", status: "received", note: "Uploaded 4 days ago" },
      { doc: "Cost basis for sold rental property", status: "missing", note: "Requested from trustee · Email" },
      { doc: "Beneficiary distribution records", status: "pending", note: "Trustee uploading this week" },
      { doc: "Fiduciary fee statement", status: "missing", note: "Last reminder: 2 days ago · Email" },
    ],
    chat: [
      { from: "firm", text: "Hello Rosa — the 1099-B shows the Alder St. rental was sold. Please send the original purchase closing statement and improvement records.", time: "Oct 8, 3:30 PM", channel: "Email" },
      { from: "client", text: "I'll have to dig through Aurelio's files. Give me a few days.", time: "Oct 9, 10:05 AM", channel: "Email" },
      { from: "system", text: "Auto-reminder sent (Email) — 2 items outstanding", time: "Oct 10, 9:00 AM" },
    ],
  },
};

// Generic checklists by return type, used for clients without a hand-written detail record.
const TYPE_CHECKLISTS = {
  "1040": ["W-2 — primary employer", "1099-INT / 1099-DIV", "1098 — mortgage interest", "Health coverage (1095)", "Photo ID"],
  "1120": ["Year-end P&L", "Balance sheet as of Dec 31", "Bank statements — 12 months", "Payroll reports (941 / 940)", "Fixed asset additions"],
  "1120S": ["Year-end P&L", "Balance sheet as of Dec 31", "Shareholder distributions", "Officer compensation W-2s", "Fixed asset additions"],
  "1065": ["Year-end P&L", "Balance sheet as of Dec 31", "Partner capital contributions", "Partner details for K-1s", "Loan statements"],
  "1041": ["Trust or estate documents", "Brokerage 1099s", "Beneficiary distribution records", "Fiduciary fee statement"],
};

export function buildDefaultDetail(client) {
  const docs = TYPE_CHECKLISTS[client.type] || TYPE_CHECKLISTS["1040"];
  const group = (STATUSES.find((s) => s.key === client.status) || NO_STATUS).group;
  const status = (i) => {
    if (group === "new") return "missing";
    if (group === "waiting" || group === "extension") return i < 2 ? "received" : i === 2 ? "pending" : "missing";
    return "received"; // everything past the client stage has all documents in
  };
  const isPerson = client.type === "1040";
  return {
    priorYear: isPerson
      ? { "Filing status": client.filingStatus, "Prior-year AGI": "—", "Prior-year refund": "—", "Prepared by": client.assignee }
      : { "Entity type": client.filingStatus, "Prior-year revenue": "—", "Prior-year tax": "—", "Prepared by": client.assignee },
    checklist: docs.map((doc, i) => ({
      doc,
      status: status(i),
      note: status(i) === "received" ? "Received" : status(i) === "pending" ? "Client says it's on the way" : "Requested",
    })),
    chat: [
      group === "new"
        ? { from: "system", text: "Intake link sent", time: "Oct 10, 9:00 AM" }
        : { from: "system", text: "Intake form completed", time: "Oct 3, 10:14 AM" },
    ],
  };
}

// ---- Activity feed ----
// Bulk events are grouped ("Reminder sent to 248 clients"); opening one lists every client in it.
// The firm-wide recipients beyond the 28 sample clients are generated deterministically.
const FIRST_NAMES = ["Aaron", "Abigail", "Adrian", "Alicia", "Andre", "Angela", "Ben", "Bianca", "Caleb", "Carmen", "Daniel", "Diana", "Eli", "Elena", "Felix", "Fatima", "Gavin", "Grace", "Hector", "Hannah", "Ian", "Isabel", "Jamal", "Julia", "Kenji", "Kara", "Liam", "Lucia", "Marcus", "Mei", "Nathan", "Nadia", "Owen", "Olivia", "Pedro", "Rina", "Quinn", "Rosa", "Samuel", "Sofia", "Tariq", "Tessa", "Victor", "Vanessa", "Wesley", "Yara", "Zane", "Zoe"];
const LAST_NAMES = ["Anderson", "Baker", "Bennett", "Castillo", "Chang", "Cooper", "Diaz", "Edwards", "Foster", "Gupta", "Hayes", "Ibrahim", "Jensen", "Kim", "Lopez", "Morales", "Nakamura", "Nguyen", "Okafor", "Patel", "Quintero", "Reyes", "Russo", "Sandoval", "Shah", "Tanaka", "Turner", "Vasquez", "Walsh", "Yamamoto"];
const BUSINESSES = [
  ["Cedar Ridge Dental PC", "1120S"], ["Bluebird Landscaping LLC", "1065"], ["Pacific Crest Partners", "1065"], ["Riverside Auto Repair Inc", "1120"],
  ["Summit Yoga Studio LLC", "1120S"], ["Oak & Iron Builders Inc", "1120"], ["Lumen Design Co", "1120S"], ["Hawthorne Family Trust", "1041"],
  ["Northgate Properties LP", "1065"], ["Silver Fern Bakery LLC", "1120S"], ["Evergreen Pet Clinic PC", "1120S"], ["Morrison Estate", "1041"],
  ["Copperline Electric Inc", "1120"], ["Tidewater Rentals LLC", "1065"], ["Juniper Wellness PC", "1120S"], ["Alvarez-Kim Trust", "1041"],
];
const PERSONAL_DOCS = ["W-2", "1099-INT", "1099-DIV", "1098 mortgage", "1095-A", "1099-NEC", "1099-R", "1098-T", "SSA-1099", "1099-B", "Charitable receipts", "Child care records"];
const BUSINESS_DOCS = ["Year-end P&L", "Balance sheet", "Bank statements", "Payroll reports", "K-1 partner details", "Fixed asset list", "Loan statements"];

function seeded(seed) {
  let x = seed;
  return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
}

function generatePeople(n, seed, fields) {
  const rnd = seeded(seed);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const used = new Set(RAW_CLIENTS.map((c) => c.name));
  const out = [];
  while (out.length < n) {
    const biz = rnd() < 0.14 ? pick(BUSINESSES) : null;
    const name = biz ? biz[0] : `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    if (used.has(name)) continue;
    used.add(name);
    const type = biz ? biz[1] : "1040";
    const docs = type === "1040" ? PERSONAL_DOCS : BUSINESS_DOCS;
    const two = [pick(docs), pick(docs)].filter((d, i, a) => a.indexOf(d) === i).join(", ");
    out.push({ name, type, channel: rnd() < 0.6 ? "SMS" : "Email", ...fields({ rnd, pick, type, docs: two }) });
  }
  return out;
}

// linked: [clientId, detail, status] for sample clients that should appear (and link) in the list.
function batch(kind, linked, generated, seed, fields) {
  const items = linked.map(([id, detail, status]) => {
    const c = RAW_CLIENTS.find((x) => x.id === id);
    return { clientId: id, name: c.name, type: c.type, channel: c.channel, detail, status };
  });
  return { kind, items: [...items, ...generatePeople(generated, seed, fields)] };
}

const weighted = (rnd, pairs) => {
  let r = rnd();
  for (const [v, w] of pairs) if ((r -= w) < 0) return v;
  return pairs[pairs.length - 1][0];
};

const REMINDER_BATCH = batch(
  "auto-reminder",
  [
    ["david-chen", "1098-E, dependent care FSA", "Replied"],
    ["flying-tails", "Payroll reports, SBA loan statement", "Opened"],
    ["linda-brown", "K-1, 1099-R", "Opened"],
    ["aurelio-trust", "Cost basis, fiduciary fees", "Delivered"],
    ["20-20-solutions", "Officer W-2s", "Opened"],
    ["paul-harris", "1099-B cost basis", "Delivered"],
    ["willamette-rentals", "Rent rolls, mortgage 1098s", "Delivered"],
    ["james-wilson", "1099-G, 1098-T", "Delivered"],
    ["michael-lee", "W-2, 1099-INT", "Delivered"],
    ["betty-clark", "SSA-1099, 1099-R", "Delivered"],
    ["nguyen-trust", "Intake form", "Opened"],
  ],
  237,
  7,
  ({ rnd, docs }) => ({ detail: docs, status: weighted(rnd, [["Delivered", 0.55], ["Opened", 0.3], ["Replied", 0.15]]) })
);

// AI document check results from overnight uploads.
const AI_PASS_BATCH = batch(
  "ai-passed",
  [
    ["patricia-moore", "6 of 6 documents verified", "Passed"],
    ["amanda-walker", "5 of 5 documents verified", "Passed"],
    ["rosewood-bakery", "5 of 5 documents verified", "Passed"],
  ],
  26,
  21,
  ({ rnd }) => ({ detail: `${4 + Math.floor(rnd() * 6)} documents verified`, status: "Passed" })
);

const AI_FLAG_BATCH = batch(
  "ai-flagged",
  [
    ["david-chen", "1099-NEC uploaded, but intake said no self-employment", "Sent back to client"],
    ["linda-brown", "Last year's K-1 from Riverbend Partners is missing", "Sent back to client"],
    ["aurelio-trust", "Rental property sale with no cost basis", "Sent back to client"],
  ],
  2,
  27,
  ({ pick }) => ({ detail: pick(["Name on W-2 doesn't match client record", "1098 shows a second property not on intake", "Blurry 1099-INT — page 2 unreadable"]), status: "Sent back to client" })
);

const CALL_BATCH = batch(
  "escalated",
  [
    ["james-wilson", "No reply for 5 days · needs 1099-G, 1098-T", "Needs a call"],
    ["michael-lee", "No reply for 6 days · needs W-2, 1099-INT", "Needs a call"],
    ["betty-clark", "No reply for 5 days · needs SSA-1099, 1099-R", "Needs a call"],
    ["willamette-rentals", "No reply for 5 days · needs rent rolls", "Needs a call"],
    ["paul-harris", "No reply for 4 days · needs 1099-B", "Needs a call"],
  ],
  0,
  1,
  () => ({})
);

const SIGN_BATCH = batch(
  "signature",
  [
    ["robert-taylor", "Prepared by Ito", "Awaiting signature"],
    ["jennifer-davis", "Prepared by Ludy", "Awaiting signature"],
    ["tanya-brooks", "Prepared by Chris Ong", "Signed"],
  ],
  9,
  33,
  ({ rnd, pick }) => ({ detail: `Prepared by ${pick(["Ludy", "Chris Ong", "Ito", "Ajita"])}`, status: rnd() < 0.4 ? "Signed" : "Awaiting signature" })
);

const DEPOSIT_BATCH = batch(
  "deposit",
  [["priya-raman", "$100 new-client deposit", "Paid"]],
  17,
  44,
  ({ rnd }) => (rnd() < 0.7 ? { detail: "$100 new-client deposit", status: "Paid" } : { detail: "$50 returning-client deposit", status: "Paid" })
);

const AI_BATCH = batch(
  "ai-summary",
  [
    ["sarah-mitchell", "Drafted from the final return", "Awaiting sign-off"],
    ["robert-taylor", "Drafted from the final return", "Awaiting sign-off"],
    ["omar-haddad", "Drafted from the final return", "Sent"],
  ],
  6,
  55,
  ({ rnd }) => ({ detail: "Drafted from the final return", status: rnd() < 0.5 ? "Sent" : "Awaiting sign-off" })
);

const FILED_BATCH = batch(
  "filed",
  [
    ["omar-haddad", "E-filed · refund $3,260", "Accepted"],
  ],
  53,
  66,
  ({ rnd }) => ({ detail: rnd() < 0.7 ? `E-filed · refund $${(300 + Math.floor(rnd() * 4200)).toLocaleString()}` : `E-filed · balance due $${(100 + Math.floor(rnd() * 2400)).toLocaleString()}`, status: "Accepted" })
);

const n = (b) => b.items.length;
// `source` tags where an event came from: "ai" (AI layer), "proconnect" (synced) or none (JB Taxes portal).
export const ACTIVITY = [
  { id: "a1", icon: "check", source: "ai", actor: "AI document check", text: `passed ${n(AI_PASS_BATCH)} clients overnight — ready for human review`, time: "7:05 AM", batch: AI_PASS_BATCH },
  { id: "a2", icon: "flag", source: "ai", actor: "AI document check", text: `flagged ${n(AI_FLAG_BATCH)} clients and sent them back automatically`, time: "7:05 AM", batch: AI_FLAG_BATCH },
  { id: "a3", icon: "reminder", actor: "Auto-reminders", text: `sent to ${n(REMINDER_BATCH)} clients for document submission`, time: "7:00 AM", batch: REMINDER_BATCH },
  { id: "a4", icon: "call", actor: `${n(CALL_BATCH)} clients`, text: "escalated to the call list — no reply in 72 hours", time: "7:00 AM", batch: CALL_BATCH },
  { id: "a5", icon: "file", source: "proconnect", actor: `${n(SIGN_BATCH)} returns`, text: "moved to For Payment & Signature", time: "Yesterday", batch: SIGN_BATCH },
  { id: "a6", icon: "payment", actor: `${n(DEPOSIT_BATCH)} new intakes`, text: `paid deposits — $${DEPOSIT_BATCH.items.reduce((a, i) => a + (i.detail.startsWith("$100") ? 100 : 50), 0).toLocaleString()} collected`, time: "Yesterday", batch: DEPOSIT_BATCH },
  { id: "a7", icon: "sparkles", source: "ai", actor: "AI review summaries", text: `drafted for ${n(AI_BATCH)} finalized returns`, time: "2 days ago", batch: AI_BATCH },
  { id: "a8", icon: "file", source: "proconnect", actor: `${n(FILED_BATCH)} returns`, text: "e-filed and Accepted this week", time: "This week", batch: FILED_BATCH },
];

export const NOTIFICATIONS = [
  { id: "n1", title: "3 clients need a call today", body: "No response in 72 hours — James Wilson, Michael Lee, Betty Clark", href: "/chase", time: "7:00 AM", read: false },
  { id: "n2", title: "AI flagged 2 document mismatches", body: "David Chen and Linda Brown need a look before prep", href: "/chase", time: "7:02 AM", read: false },
  { id: "n3", title: "Sarah Mitchell's AI summary is ready", body: "Review and approve before sending", href: "/review/sarah-mitchell", time: "2 days ago", read: false },
  { id: "n4", title: "Extension deadline in 3 days", body: "8 returns still collecting documents", href: "/clients", time: "Yesterday", read: true },
];

// Admin chase queue (Screen 4)
export const CHASE = {
  uploadedOvernight: 8,
  nudgedOvernight: [
    { name: "David Chen", channel: "SMS", items: "1098-E, FSA statement", result: "Replied" },
    { name: "Linda Brown", channel: "SMS", items: "K-1, 1099-R", result: "Opened" },
    { name: "Flying Tails Inc", channel: "Email", items: "Payroll reports, SBA loan", result: "Opened" },
    { name: "Aurelio & Rosa Alvarez Trust", channel: "Email", items: "Cost basis, fiduciary fees", result: "Delivered" },
    { name: "20 20 Solutions LLC", channel: "Email", items: "Officer W-2s", result: "Opened" },
    { name: "Paul Harris", channel: "SMS", items: "1099-B", result: "Delivered" },
    { name: "Willamette Rentals Partners", channel: "Email", items: "Rent rolls, 1098s", result: "Delivered" },
    { name: "Sarah Mitchell", channel: "SMS", items: "1099-INT, 1095-A", result: "Replied" },
    { name: "James Wilson", channel: "SMS", items: "1099-G, 1098-T", result: "Delivered" },
    { name: "Michael Lee", channel: "SMS", items: "W-2, 1099-INT", result: "Delivered" },
    { name: "Betty Clark", channel: "Email", items: "SSA-1099, 1099-R", result: "Delivered" },
    { name: "Nguyen Family Trust", channel: "Email", items: "Intake form", result: "Opened" },
    { name: "Priya Raman", channel: "SMS", items: "Intake form", result: "Replied" },
    { name: "Karen White", channel: "SMS", items: "Signed 8879", result: "Opened" },
    { name: "Jennifer Davis", channel: "SMS", items: "Signed 8879", result: "Delivered" },
  ],
  noResponse: [
    { id: "james-wilson", days: 5, channel: "SMS", reason: "1099-G, 1098-T, photo ID" },
    { id: "michael-lee", days: 6, channel: "SMS", reason: "W-2, 1099-INT" },
    { id: "betty-clark", days: 5, channel: "Email", reason: "SSA-1099, 1099-R" },
    { id: "willamette-rentals", days: 5, channel: "Email", reason: "Rent rolls, mortgage 1098s" },
    { id: "paul-harris", days: 4, channel: "SMS", reason: "1099-B cost basis" },
  ],
  flags: [
    { id: "f1", clientId: "david-chen", severity: "high", flag: "Said 'no self-employment' on intake, but a 1099-NEC was uploaded.", ask: "we received a 1099-NEC for consulting work, but your intake said no self-employment. Could you confirm, and send a summary of any related business expenses?" },
    { id: "f2", clientId: "linda-brown", severity: "high", flag: "Prior year had a K-1 from Riverbend Partners; nothing K-1-like has arrived this year.", ask: "last year you received a K-1 from Riverbend Partners. Are you still a partner there? If so, please upload this year's K-1 when it arrives." },
    { id: "f3", clientId: "aurelio-trust", severity: "medium", flag: "1099-B shows the sale of a rental property with no cost basis provided.", ask: "the trust's 1099-B shows the Alder St. property was sold. We need the original purchase closing statement and any improvement records to calculate the gain." },
    { id: "f4", clientId: "flying-tails", severity: "medium", flag: "12-month bank statement set is missing March.", ask: "we have 11 of 12 monthly bank statements — could you upload the one for March?" },
    { id: "f5", clientId: "maria-garcia", severity: "low", flag: "W-2 employer EIN differs from last year — new job not mentioned on intake.", ask: "your W-2 is from a new employer this year. Did you also work for your previous employer at any point? If so, please send that W-2 too." },
  ],
};

// Segmented reminder rules for the next filing season.
export const REMINDER_RULES = [
  { id: "r-eic", name: "EIC filers", description: "Earned Income Credit clients — refunds are time-sensitive", deadline: "2027-02-15", channel: "SMS", cadence: 3, enabled: true, clients: 212 },
  { id: "r-1065", name: "Partnerships (1065)", description: "K-1s have to reach partners before their own returns", deadline: "2027-02-20", channel: "Email", cadence: 7, enabled: true, clients: 46 },
  { id: "r-1120s", name: "S corporations (1120S)", description: "Shareholder K-1s and officer W-2s", deadline: "2027-02-25", channel: "Email", cadence: 7, enabled: true, clients: 58 },
  { id: "r-schedc", name: "Schedule C filers", description: "Self-employed and freelance (1099-NEC) clients", deadline: "2027-03-01", channel: "Email + SMS", cadence: 5, enabled: true, clients: 184 },
  { id: "r-rental", name: "Rental property owners", description: "Schedule E — rent rolls, 1098s and repair receipts", deadline: "2027-03-05", channel: "Email", cadence: 7, enabled: true, clients: 97 },
  { id: "r-1041", name: "Trusts & estates (1041)", description: "Brokerage statements arrive late — start early", deadline: "2027-03-10", channel: "Email", cadence: 10, enabled: false, clients: 22 },
  { id: "r-1120", name: "C corporations (1120)", description: "Year-end close package from the bookkeeper", deadline: "2027-03-15", channel: "Email", cadence: 7, enabled: true, clients: 31 },
  { id: "r-w2", name: "W-2 only, returning", description: "Simple returns — gentle nudges only", deadline: "2027-03-31", channel: "SMS", cadence: 10, enabled: true, clients: 402 },
];

export const CHANNELS = ["Email", "SMS", "Email + SMS"];
export const CADENCES = [3, 5, 7, 10, 14];

// Pre-filled intake (Screen 3)
export const INTAKE = {
  year: "2025",
  returning: {
    name: "Sarah Mitchell",
    fields: {
      legalName: "Sarah Mitchell",
      filingStatus: "Single",
      address: "1635 Maple St, Portland, OR 97201",
      email: "sarah.mitchell@example.com",
      phone: "(503) 555-1520",
      dependents: "0",
    },
    lastYearDocs: ["W-2 (Acme Corp)", "1099-DIV (Vanguard)", "1098 (Wells Fargo)", "1099-INT (Chase)"],
    answers: { married: "No", child: "No", home: "No", business: "Yes", crypto: "No" },
  },
  newClient: {
    name: "",
    fields: { legalName: "", filingStatus: "", address: "", email: "", phone: "", dependents: "0" },
    lastYearDocs: [],
    answers: {},
  },
  lifeChanges: [
    { key: "married", short: "Marriage / divorce", q: "Did you get married or divorced?", expands: ["Spouse's legal name", "Date of marriage or divorce"], docs: [] },
    { key: "child", short: "New child", q: "Did you have or adopt a child?", expands: ["Child's name", "Date of birth"], docs: ["Child's SSN card"] },
    { key: "home", short: "Home sale / purchase", q: "Did you buy or sell a home?", expands: ["Property address", "Closing date"], docs: ["Closing statement (HUD-1 / CD)"] },
    { key: "business", short: "Self-employment", q: "Did you start a business or freelance?", expands: ["Business name", "Approx. 1099-NEC income", "Main business expenses"], docs: ["1099-NEC forms", "Business expense summary"] },
    { key: "crypto", short: "Stock / crypto sales", q: "Did you sell stocks or crypto?", expands: ["Brokerage or exchange name"], docs: ["1099-B / exchange report"] },
  ],
  deposit: { returning: 50, newClient: 100 },
};

// AI review summaries (Screen 5). Text is stored as plain strings so it can be edited.
export const REVIEWS = {
  "sarah-mitchell": {
    year: "2025",
    figures: [
      { label: "Wages", value: "$84,250" },
      { label: "Adjusted gross income", value: "$86,180" },
      { label: "Federal refund", value: "$1,310" },
      { label: "Oregon refund", value: "$420" },
    ],
    summary:
      "You earned $84,250 in wages, filed as Single, and took the standard deduction of $14,600.\n\nYour adjusted gross income was $86,180, placing you in the 22% federal tax bracket.\n\nYou're receiving a federal refund of $1,310 and an Oregon state refund of $420.\n\nCompared to last year, your income rose about 3.5% and your refund is $70 higher.",
    recommendations:
      "Consider an HSA contribution next year — you could reduce taxable income by up to $4,300 if you're on an eligible health plan.\nYour new freelance income means quarterly estimated taxes may apply for 2026 — we can set that up.\nA traditional IRA contribution before April 15 could further lower this year's tax if you qualify.",
  },
  "robert-taylor": {
    year: "2025",
    figures: [
      { label: "Household wages", value: "$163,400" },
      { label: "Adjusted gross income", value: "$171,920" },
      { label: "Federal balance due", value: "$940" },
      { label: "Oregon refund", value: "$1,105" },
    ],
    summary:
      "You and Karen filed jointly with combined wages of $163,400 plus $8,520 in dividends and interest.\n\nYou itemized this year — mortgage interest and property taxes came to $31,200, which beat the $29,200 standard deduction.\n\nYou owe $940 federally, mostly because withholding on your second job was too low. Oregon is refunding $1,105.\n\nYour child tax credit for Emma and Leo lowered your tax by $4,000.",
    recommendations:
      "Update your W-4 at your second employer — adding about $80 per paycheck would avoid a balance due next year.\nYou're close to the limit where itemizing stops helping; bunching charitable gifts into one year could help.\nA 529 contribution to an Oregon plan earns a state tax credit of up to $300.",
  },
  "omar-haddad": {
    year: "2025",
    figures: [
      { label: "Household income", value: "$118,700" },
      { label: "Adjusted gross income", value: "$112,300" },
      { label: "Federal refund", value: "$3,260" },
      { label: "Oregon refund", value: "$610" },
    ],
    summary:
      "You filed jointly with $118,700 in income, including Leila's new part-time design business.\n\nBusiness expenses of $6,400 (software, a laptop and home-office costs) reduced your taxable income.\n\nYou're receiving a federal refund of $3,260 and an Oregon refund of $610. Your return was e-filed and accepted.",
    recommendations:
      "Leila's business is growing — making quarterly estimated payments in 2026 will avoid an underpayment penalty.\nA SEP-IRA for the business could shelter up to 20% of its net profit.\nKeep mileage logs for client visits; they were not claimed this year.",
  },
  // Drafted from the firm's 2025 vs 2024 tax summary export for 1202 Shasta, LLC (Form 1065, Federal + California).
  "shasta-llc": {
    year: "2025",
    basis: "Federal & California income tax summary and Schedule L balance sheet, 2025 compared with 2024",
    figures: [
      { label: "Net rental real estate loss", value: "−$4,462" },
      { label: "Total assets (year end)", value: "$501,436" },
      { label: "Long-term notes payable", value: "$372,996" },
      { label: "Partners' capital", value: "$128,440" },
    ],
    summary:
      "1202 Shasta, LLC is a partnership that holds rental real estate. In 2025 it had no trade or business income or deductions — all of its activity came from the rental property, so ordinary business income was $0, the same as 2024.\n\nThe rental property produced a net loss of $4,462 for 2025. That is $2,013 better than 2024's $6,475 loss, an improvement of about 31%. The partnership itself doesn't pay federal income tax; this loss passes through to the partners on their Schedule K-1s.\n\nAt year end the partnership held $501,436 in total assets: $310,000 of land, buildings that cost $320,300 and are carried at $190,231 after $130,069 of accumulated depreciation, and $1,205 in cash. Total assets fell by $12,845 during the year, from $514,281 at the start of 2025.\n\nAgainst those assets, the partnership owes $372,996 on long-term notes, and the partners' capital accounts total $128,440.\n\nFor California, the return shows $793 of depreciation, giving a California ordinary loss of $793 — slightly smaller than 2024's $881.",
    recommendations:
      "The $4,462 rental loss is generally a passive loss for each partner. Whether a partner can use it this year depends on their own income and other passive activity, so send each partner's K-1 to their preparer early.\nCash on hand is $1,205 against $372,996 of long-term debt. Consider building a cash reserve for repairs, vacancies and loan payments.\nFederal and California depreciation differ. Keep both depreciation schedules reconciled so any gain on a future sale is calculated correctly on each return.",
  },
};
