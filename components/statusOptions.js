import { AI_STATUSES, PROCONNECT_STATUSES, STATUS_GROUPS } from "../lib/data";
import { StatusBadge } from "./ui";

// Options for every status dropdown. AI statuses are listed for reference but can't be picked —
// only the AI document check sets them. ProConnect statuses sync back to ProConnect.
export const STATUS_OPTIONS = [
  { header: "Set by AI document check" },
  ...AI_STATUSES.map((s) => ({ value: s.key, label: s.label, render: <StatusBadge status={s.key} showSource />, disabled: true })),
  { header: "ProConnect statuses" },
  ...PROCONNECT_STATUSES.map((s) => ({ value: s.key, label: s.label, render: <StatusBadge status={s.key} /> })),
  { divider: true },
  { value: "none", label: "Clear status", render: <span className="text-2">Clear status</span> },
];

// Sort statuses in pipeline order.
export const GROUP_ORDER = Object.fromEntries(STATUS_GROUPS.map((g, i) => [g.key, i]));
