"use client";
import { ArrowRightLeft, CheckCircle2, Lightbulb } from "lucide-react";
import { useStore } from "./store";
import { Avatar, Badge, Button, Card, useToast } from "./ui";
import { LOAD_GROUPS, cx } from "../lib/utils";

// Who is overloaded? One bar per preparer: active returns by status band, against their capacity.
export default function TeamWorkload({ selected, onSelect }) {
  const { team, rebalanceSuggestion: suggestion, actions } = useStore();
  const toast = useToast();

  const rows = [...team].sort((a, b) => b.ratio - a.ratio);
  const totalActive = team.reduce((a, p) => a + p.active, 0);
  const totalCapacity = team.reduce((a, p) => a + p.capacity, 0);
  const overloaded = team.filter((p) => p.status.label === "Overloaded").length;
  const scale = Math.max(...team.map((p) => Math.max(p.active, p.capacity))) * 1.06;
  const pct = (v) => `${(Math.max(0, v) / scale) * 100}%`;

  const rebalance = () => {
    actions.rebalance(suggestion);
    toast({
      title: `Moved ${suggestion.n} returns from ${suggestion.from} to ${suggestion.to}`,
      description: "Workload bars updated.",
      action: { label: "Undo", onClick: actions.undoRebalance },
    });
  };

  return (
    <Card
      title="Team workload"
      subtitle="Active returns per preparer against their capacity. Click someone to see their clients."
      actions={<Badge tone={overloaded ? "danger" : "success"}>{overloaded ? `${overloaded} overloaded` : "Balanced"}</Badge>}
    >
      <div className="wl-summary">
        <div className="mini-stat">
          <div className="mini-stat-label">Active returns</div>
          <div className="mini-stat-value">{totalActive}</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Team capacity</div>
          <div className="mini-stat-value">{totalCapacity}</div>
        </div>
        <div className={cx("mini-stat", totalActive > totalCapacity && "is-danger")}>
          <div className="mini-stat-label">Firm load</div>
          <div className="mini-stat-value">{Math.round((totalActive / totalCapacity) * 100)}%</div>
        </div>
      </div>

      <div className="wl-rows">
        {rows.map((p) => (
          <button
            key={p.name}
            type="button"
            className={cx("wl-row", selected === p.name && "is-active")}
            onClick={() => onSelect(selected === p.name ? null : p.name)}
            aria-pressed={selected === p.name}
            aria-label={`${p.name}: ${p.active} active returns of ${p.capacity} capacity, ${p.status.label}`}
          >
            <span className="wl-person">
              <Avatar name={p.name} size={32} />
              <span className="wl-person-text">
                <span className="wl-name">{p.name}</span>
                <span className="wl-role">{p.role}</span>
              </span>
            </span>
            <span className="wl-track" aria-hidden>
              <span className="wl-fill">
                {LOAD_GROUPS.map((g) =>
                  p.bands[g.key] > 0 ? (
                    <span key={g.key} className={`wl-seg tone-${g.tone}`} style={{ width: pct(p.bands[g.key]) }} title={`${g.label}: ${p.bands[g.key]}`} />
                  ) : null
                )}
              </span>
              {p.active > p.capacity && <span className="wl-over" style={{ left: pct(p.capacity), width: pct(p.active - p.capacity) }} />}
              <span className="wl-cap" style={{ left: pct(p.capacity) }} title={`Capacity: ${p.capacity}`} />
            </span>
            <span className="wl-nums">
              <span>
                <b>{p.active}</b> / {p.capacity}
              </span>
              <span className="wl-sub">
                {Math.round(p.ratio * 100)}% · {p.filed} filed
              </span>
            </span>
            <span className="wl-status">
              <Badge tone={p.status.tone}>{p.status.label}</Badge>
            </span>
          </button>
        ))}
      </div>

      <div className="legend">
        {LOAD_GROUPS.map((g) => (
          <span key={g.key} className="legend-item">
            <span className={`legend-swatch tone-${g.tone}`} />
            {g.label}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-cap" />
          Capacity
        </span>
        <span className="legend-item">
          <span className="legend-swatch wl-over-swatch" />
          Over capacity
        </span>
      </div>

      {suggestion ? (
        <div className="wl-suggest">
          <Lightbulb size={18} className="wl-suggest-icon" aria-hidden />
          <div className="wl-suggest-text">
            <b>{suggestion.from}</b> is {suggestion.over} returns over capacity and <b>{suggestion.to}</b> has room for {suggestion.room}.
            <div className="text-2">
              Suggested: hand over {suggestion.n} returns in <i>{suggestion.groupLabel}</i> — nobody has started on them yet.
            </div>
          </div>
          <Button size="sm" icon={ArrowRightLeft} onClick={rebalance}>
            Move {suggestion.n} to {suggestion.to}
          </Button>
        </div>
      ) : (
        <div className="wl-suggest is-ok">
          <CheckCircle2 size={18} className="wl-suggest-icon" aria-hidden />
          <div className="wl-suggest-text">
            {team.some((p) => p.active > p.capacity)
              ? "Everyone else is at capacity too — consider adding seasonal help."
              : "Nobody is over capacity — the team is balanced."}
          </div>
        </div>
      )}
    </Card>
  );
}
