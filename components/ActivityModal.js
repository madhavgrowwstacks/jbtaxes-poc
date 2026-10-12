"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, Mail, MessageSquare, Search, SearchX } from "lucide-react";
import { Avatar, Badge, Button, EmptyState, Modal, useToast } from "./ui";
import { cx, downloadCSV, fmtWhen } from "../lib/utils";

const STATUS_TONES = {
  Delivered: "neutral",
  Opened: "info",
  Replied: "success",
  Sent: "info",
  Received: "success",
  Flagged: "warning",
  "Needs a call": "danger",
  Called: "success",
  "Awaiting signature": "violet",
  Signed: "success",
  Paid: "success",
  "Awaiting sign-off": "violet",
  Accepted: "success",
  Updated: "neutral",
  Reassigned: "info",
};
const PAGE_SIZE = 50;

// Lists every client inside a grouped activity entry ("Reminder sent to 248 clients").
// Mount with key={item.id} so search/filter state resets per entry.
export default function ActivityModal({ item, onClose }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [limit, setLimit] = useState(PAGE_SIZE);

  if (!item?.batch) return null;

  const all = item.batch.items;
  const counts = all.reduce((acc, i) => ((acc[i.status] = (acc[i.status] || 0) + 1), acc), {});
  const statuses = Object.keys(counts);
  const term = q.trim().toLowerCase();
  const filtered = all.filter(
    (i) => (status === "All" || i.status === status) && (!term || i.name.toLowerCase().includes(term) || (i.detail || "").toLowerCase().includes(term))
  );
  const shown = filtered.slice(0, limit);

  const exportCSV = () => {
    downloadCSV(`activity-${item.id}.csv`, [["Client", "Return", "Channel", "Details", "Status"], ...filtered.map((i) => [i.name, i.type, i.channel, i.detail, i.status])]);
    toast({ title: "Export ready", description: `${filtered.length} rows downloaded as CSV.` });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${item.actor} ${item.text}`}
      description={`${fmtWhen(item.time)} · ${all.length.toLocaleString()} ${all.length === 1 ? "client" : "clients"}`}
      footer={
        <>
          <span className="text-2" style={{ marginRight: "auto", fontSize: 13, alignSelf: "center" }}>
            Showing {shown.length} of {filtered.length}
          </span>
          <Button variant="secondary" icon={Download} onClick={exportCSV}>
            Export CSV
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="ct-search" style={{ maxWidth: "none" }}>
        <Search size={16} aria-hidden />
        <input
          className="input"
          type="search"
          placeholder="Search by client or document…"
          aria-label="Search this list"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE_SIZE);
          }}
        />
      </div>

      {statuses.length > 1 && (
        <div className="chips" role="group" aria-label="Filter by status">
          {["All", ...statuses].map((st) => (
            <button
              key={st}
              type="button"
              className={cx("chip", status === st && "is-active")}
              aria-pressed={status === st}
              onClick={() => {
                setStatus(st);
                setLimit(PAGE_SIZE);
              }}
            >
              {st}
              <span className="chip-count">{st === "All" ? all.length : counts[st]}</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={SearchX} title="No matches">
          Try a different name or status.
        </EmptyState>
      ) : (
        <div className="ar-list">
          {shown.map((i, idx) => (
            <div key={i.name + idx} className="ar-row">
              <Avatar name={i.name} size={30} />
              <div className="ar-main">
                <div className="ar-name">
                  {i.clientId ? (
                    <Link href={`/client/${i.clientId}`} onClick={onClose}>
                      {i.name}
                    </Link>
                  ) : (
                    i.name
                  )}
                  {i.type && <span className="tag">{i.type}</span>}
                </div>
                {i.detail && <div className="ar-detail">{i.detail}</div>}
              </div>
              {i.channel && (
                <span className="ar-channel">
                  {i.channel === "SMS" ? <MessageSquare size={13} aria-hidden /> : <Mail size={13} aria-hidden />}
                  {i.channel}
                </span>
              )}
              <Badge tone={i.tone || STATUS_TONES[i.status] || "neutral"} dot>
                {i.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {shown.length < filtered.length && (
        <Button variant="secondary" block onClick={() => setLimit((l) => l + PAGE_SIZE)}>
          Show {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
        </Button>
      )}
    </Modal>
  );
}
