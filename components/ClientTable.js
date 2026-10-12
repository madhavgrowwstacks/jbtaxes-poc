"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Download, Mail, MessageSquare, Search, SearchX, Send, X } from "lucide-react";
import { useStore } from "./store";
import ReminderModal from "./ReminderModal";
import { Avatar, Badge, Button, EmptyState, Pagination, Select, SortHeader, SourceTag, StatusBadge, Table, useToast } from "./ui";
import { GROUP_ORDER, STATUS_OPTIONS } from "./statusOptions";
import { ASSIGNEES, RETURN_TYPES, RETURN_TYPE_LABELS } from "../lib/data";
import { cx, downloadCSV, fmtWhen, groupMeta, groupOf, isAtRisk, statusMeta } from "../lib/utils";

export const PRESETS = [
  { key: "all", label: "All", test: () => true },
  { key: "mine", label: "Mine (Jasmin)", test: (c) => c.assignee === "Jasmin Baros" },
  { key: "jas", label: "For Review (Jas)", test: (c) => c.status === "review_jas" },
  { key: "ready", label: "AI-verified · ready", test: (c) => c.status === "ai_verified" },
  { key: "flagged", label: "AI flagged", test: (c) => c.status === "ai_flagged" },
  { key: "waiting", label: "Waiting on client", test: (c) => groupOf(c) === "waiting" },
  { key: "risk", label: "At risk", test: isAtRisk },
  { key: "rejected", label: "Rejected", test: (c) => groupOf(c) === "rejected" },
];

// Filter keys: a preset key, "group:<status group>" or "assignee:<name>".
function filterTest(key) {
  if (key.startsWith("group:")) return (c) => groupOf(c) === key.slice(6);
  if (key.startsWith("assignee:")) return (c) => c.assignee === key.slice(9);
  return PRESETS.find((p) => p.key === key)?.test || (() => true);
}

const SORTERS = {
  name: (c) => c.name.toLowerCase(),
  type: (c) => c.type,
  assignee: (c) => c.assignee,
  status: (c) => GROUP_ORDER[groupOf(c)] * 100 + statusMeta(c.status).label.charCodeAt(0),
  days: (c) => c.daysWaiting,
};

const ASSIGNEE_OPTIONS = ASSIGNEES.map((a) => ({
  value: a,
  label: a,
  render: (
    <>
      <Avatar name={a} size={20} />
      {a}
    </>
  ),
}));
const TYPE_OPTIONS = [{ value: "all", label: "All return types" }, ...RETURN_TYPES.map((t) => ({ value: t, label: `${t} · ${RETURN_TYPE_LABELS[t]}` }))];

const isFresh = (v) => typeof v === "number" && Date.now() - v < 60 * 60 * 1000;

export default function ClientTable({ pageSize = 10, filter: filterProp, onFilterChange, title }) {
  // Closed seasons are read-only: no inline edits or reminders.
  const { yearClients: clients, isArchived: readOnly, taxYear, actions } = useStore();
  const router = useRouter();
  const toast = useToast();

  const [innerFilter, setInnerFilter] = useState("all");
  const filter = filterProp ?? innerFilter;
  const setFilter = onFilterChange ?? setInnerFilter;
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState(() => (readOnly ? { key: "name", dir: "asc" } : { key: "days", dir: "desc" }));
  const [page, setPage] = useState(1);
  const [remindFor, setRemindFor] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => setPage(1), [filter, q, type]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1700);
    return () => clearTimeout(t);
  }, [flash]);

  const term = q.trim().toLowerCase();
  const test = filterTest(filter);
  const filtered = clients.filter(
    (c) => test(c) && (type === "all" || c.type === type) && (!term || c.name.toLowerCase().includes(term))
  );
  const sorted = [...filtered].sort((a, b) => {
    const f = SORTERS[sort.key];
    const va = f(a);
    const vb = f(b);
    const r = va < vb ? -1 : va > vb ? 1 : a.name.localeCompare(b.name);
    return sort.dir === "asc" ? r : -r;
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const onSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "days" ? "desc" : "asc" }));

  const changeStatus = (c, status) => {
    const prev = c.status;
    actions.setStatus(c.id, status);
    setFlash(c.id);
    toast({
      title: `${c.name} → ${statusMeta(status).label}`,
      description: "Synced to ProConnect · dashboard updated.",
      action: { label: "Undo", onClick: () => actions.setStatus(c.id, prev) },
    });
  };
  const changeAssignee = (c, assignee) => {
    const prev = c.assignee;
    actions.setAssignee(c.id, assignee);
    setFlash(c.id);
    toast({ title: `${c.name} reassigned to ${assignee}`, action: { label: "Undo", onClick: () => actions.setAssignee(c.id, prev) } });
  };

  const exportCSV = () => {
    downloadCSV(`jbtaxes-clients-ty${taxYear}.csv`, [
      ["Client", "Return", "Assignee", "Status", "Days waiting", readOnly ? "Filed" : "Last nudge", "Channel", "Email", "Phone"],
      ...sorted.map((c) => [c.name, c.type, c.assignee, statusMeta(c.status).label, c.daysWaiting, readOnly ? c.filedOn : fmtWhen(c.lastNudge), c.channel, c.email, c.phone]),
    ]);
    toast({ title: "Export ready", description: `${sorted.length} clients downloaded as CSV.` });
  };

  const clearAll = () => {
    setFilter("all");
    setQ("");
    setType("all");
  };

  const stageFilter = filter.startsWith("group:") ? groupMeta(filter.slice(6)) : null;
  const assigneeFilter = filter.startsWith("assignee:") ? filter.slice(9) : null;

  return (
    <section className="card" aria-label={title || "Clients"}>
      <div className="ct-toolbar">
        <div className="ct-toolbar-row">
          <div className="ct-search">
            <Search size={16} aria-hidden />
            <input
              className="input"
              type="search"
              placeholder="Search by client name…"
              aria-label="Search clients by name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={type} options={TYPE_OPTIONS} onChange={setType} ariaLabel="Filter by return type" size="sm" menuWidth={220} />
          <div style={{ marginLeft: "auto" }}>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCSV}>
              Export CSV
            </Button>
          </div>
        </div>
        <div className="chips" role="group" aria-label="Quick filters">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={cx("chip", filter === p.key && "is-active")}
              aria-pressed={filter === p.key}
              onClick={() => setFilter(p.key)}
            >
              {p.label}
              <span className="chip-count">{clients.filter(p.test).length}</span>
            </button>
          ))}
          {stageFilter && (
            <button type="button" className="chip is-active" onClick={() => setFilter("all")} aria-label={`Remove status filter ${stageFilter.label}`}>
              Status: {stageFilter.label}
              <X size={13} />
            </button>
          )}
          {assigneeFilter && (
            <button type="button" className="chip is-active" onClick={() => setFilter("all")} aria-label={`Remove preparer filter ${assigneeFilter}`}>
              Preparer: {assigneeFilter}
              <X size={13} />
            </button>
          )}
        </div>
        <div className="hint">
          Status source: <SourceTag source="proconnect" compact /> synced with ProConnect · <SourceTag source="ai" compact /> set by the AI document check
        </div>
      </div>

      <Table minWidth={1000}>
        <thead>
          <tr>
            <SortHeader label="Client" sortKey="name" sort={sort} onSort={onSort} />
            <SortHeader label="Return" sortKey="type" sort={sort} onSort={onSort} width={90} />
            <SortHeader label="Assignee" sortKey="assignee" sort={sort} onSort={onSort} width={190} />
            <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} width={280} />
            <SortHeader label="Waiting" sortKey="days" sort={sort} onSort={onSort} width={96} />
            <th style={{ width: 150 }}>{readOnly ? "Filed" : "Last nudge"}</th>
            <th style={{ width: 130 }}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={SearchX}
                  title="No clients match"
                  action={
                    <Button variant="secondary" size="sm" onClick={clearAll}>
                      Clear filters
                    </Button>
                  }
                >
                  Try a different name or remove a filter.
                </EmptyState>
              </td>
            </tr>
          )}
          {rows.map((c) => (
            <tr
              key={c.id}
              className={cx("is-clickable", flash === c.id && "row-flash")}
              tabIndex={0}
              onClick={() => router.push(`/client/${c.id}`)}
              onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && router.push(`/client/${c.id}`)}
            >
              <td>
                <div className="ct-client">
                  <Avatar name={c.name} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/client/${c.id}`} className="ct-client-name" onClick={(e) => e.stopPropagation()} tabIndex={-1}>
                      {c.name}
                    </Link>
                    <div className="ct-client-sub">{c.filingStatus}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="tag" title={RETURN_TYPE_LABELS[c.type]}>
                  {c.type}
                </span>
              </td>
              {readOnly ? (
                <td>
                  <span className="ct-client" style={{ gap: 8 }}>
                    <Avatar name={c.assignee} size={22} />
                    {c.assignee}
                  </span>
                </td>
              ) : (
              <td onClick={(e) => e.stopPropagation()}>
                <Select
                  variant="cell"
                  size="sm"
                  value={c.assignee}
                  options={ASSIGNEE_OPTIONS}
                  onChange={(v) => changeAssignee(c, v)}
                  ariaLabel={`Assignee for ${c.name}`}
                  renderValue={(o) => (
                    <>
                      <Avatar name={o.value} size={22} />
                      {o.label}
                    </>
                  )}
                  menuWidth={200}
                />
              </td>
              )}
              {readOnly ? (
                <td>
                  <StatusBadge status={c.status} showSource />
                </td>
              ) : (
              <td onClick={(e) => e.stopPropagation()}>
                <Select
                  variant="cell"
                  size="sm"
                  value={c.status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => changeStatus(c, v)}
                  ariaLabel={`Status for ${c.name}`}
                  renderValue={(o) => <StatusBadge status={o.value} showSource />}
                  menuWidth={300}
                />
              </td>
              )}
              <td>
                {readOnly ? (
                  <span className="text-3">—</span>
                ) : (
                  <span className={cx("ct-days", c.daysWaiting >= 5 ? "is-late" : c.daysWaiting >= 3 && "is-warn")}>{c.daysWaiting}d</span>
                )}
              </td>
              <td>
                {readOnly ? (
                  <span className="ct-nudge">
                    {c.filedOn}
                    {c.extended && <Badge tone="warning">Ext.</Badge>}
                  </span>
                ) : (
                  <span className={cx("ct-nudge", isFresh(c.lastNudge) && "is-fresh")}>
                    {c.channel === "SMS" ? <MessageSquare size={14} aria-label="SMS" /> : <Mail size={14} aria-label="Email" />}
                    {fmtWhen(c.lastNudge)}
                  </span>
                )}
              </td>
              <td>
                <div className="ct-actions">
                  {!readOnly && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Send}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemindFor(c);
                      }}
                    >
                      Remind
                    </Button>
                  )}
                  <span className="icon-btn" aria-hidden style={{ width: 28, height: 32 }}>
                    <ChevronRight size={16} />
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={sorted.length}
        from={sorted.length ? (current - 1) * pageSize + 1 : 0}
        to={Math.min(current * pageSize, sorted.length)}
        onPage={setPage}
      />

      <ReminderModal client={remindFor} open={!!remindFor} onClose={() => setRemindFor(null)} onSent={setFlash} />
    </section>
  );
}
