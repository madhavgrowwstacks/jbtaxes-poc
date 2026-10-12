"use client";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  FileCheck2,
  FileText,
  MessageSquare,
  PhoneCall,
  Plus,
  Sparkles,
  Timer,
  Upload,
  UserCog,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import ClientTable from "../components/ClientTable";
import TeamWorkload from "../components/TeamWorkload";
import ActivityModal from "../components/ActivityModal";
import { useStore } from "../components/store";
import { Badge, Button, Card, ProgressBar, SourceTag, Sparkline } from "../components/ui";
import { CHASE, KPI_TRENDS, RETURN_TYPE_LABELS } from "../lib/data";
import { cx, fmtWhen } from "../lib/utils";

const TONE_VARS = {
  info: ["var(--info-bg)", "var(--info)"],
  warning: ["var(--warning-bg)", "var(--warning)"],
  danger: ["var(--danger-bg)", "var(--danger)"],
  success: ["var(--success-bg)", "var(--success)"],
  violet: ["var(--violet-bg)", "var(--violet)"],
  neutral: ["var(--neutral-bg)", "var(--neutral)"],
};
const toneStyle = (tone) => ({ background: TONE_VARS[tone][0], color: TONE_VARS[tone][1] });

const ACTIVITY_ICONS = {
  upload: [Upload, "info"],
  reminder: [BellRing, "warning"],
  check: [CheckCircle2, "success"],
  payment: [CreditCard, "violet"],
  flag: [AlertTriangle, "danger"],
  sparkles: [Sparkles, "violet"],
  file: [FileCheck2, "success"],
  message: [MessageSquare, "info"],
  call: [PhoneCall, "info"],
  user: [UserCog, "neutral"],
};

// Icons for the closed-season KPI cards defined in lib/data.js.
const ARCHIVE_KPI_ICONS = { filed: CheckCircle2, clock: Clock, refund: Banknote, accept: BadgeCheck, users: Users, timer: Timer };

export default function Dashboard() {
  const { totals, activity, chase, taxYear, season, isArchived } = useStore();
  const [filter, setFilter] = useState("all");
  const [openActivity, setOpenActivity] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => setFilter("all"), [taxYear]);

  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const callsLeft = CHASE.noResponse.filter((r) => !chase.called[r.id]).length;

  const applyFilter = (f) => {
    setFilter(f);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const kpis = isArchived
    ? season.kpis.map((k) => ({ ...k, icon: ARCHIVE_KPI_ICONS[k.icon], trend: k }))
    : [
        { key: "total", label: "Total returns", value: total.toLocaleString(), icon: FileText, tone: "info", filter: "all" },
        { key: "waiting", label: "Waiting on client", value: totals.waiting, icon: Clock, tone: "warning", filter: "waiting" },
        { key: "ready_review", label: "AI-verified, ready", value: totals.ready_review, icon: Sparkles, tone: "violet", filter: "ready", source: "ai" },
        { key: "review", label: "In human review", value: totals.review, icon: Eye, tone: "info", filter: "group:review" },
        { key: "rejected", label: "Rejected", value: totals.rejected, icon: AlertTriangle, tone: "danger", filter: "rejected" },
        { key: "filed", label: "Filed", value: totals.filed, icon: CheckCircle2, tone: "success", filter: "group:filed" },
      ].map((k) => ({ ...k, trend: KPI_TRENDS[k.key] }));

  const feed = isArchived ? season.highlights : activity.slice(0, 12);
  const selectedPreparer = filter.startsWith("assignee:") ? filter.slice(9) : null;

  return (
    <div className="page">
      <PageHeader
        title={isArchived ? `Tax year ${taxYear} — season review` : "Firm dashboard"}
        description={
          isArchived
            ? `${season.closedLabel} · ${season.filed.toLocaleString()} returns filed`
            : `Tax year ${taxYear} · ${total.toLocaleString()} of ${season.capacity.toLocaleString()} returns onboarded (${Math.round(
                (total / season.capacity) * 100
              )}%) · ${season.daysToDeadline} days to the ${season.deadlineLabel}`
        }
        actions={
          !isArchived && (
            <>
              <Button variant="secondary" icon={PhoneCall} href="/chase">
                Chase queue{callsLeft ? ` (${callsLeft})` : ""}
              </Button>
              <Button icon={Plus} href="/intake">
                New intake
              </Button>
            </>
          )
        }
      />

      <div className="kpi-grid">
        {kpis.map((k) => {
          const { trend } = k;
          const Arrow = trend.dir === "up" ? ArrowUpRight : ArrowDownRight;
          const Tag = k.filter ? "button" : "div";
          return (
            <Tag
              key={k.key}
              type={k.filter ? "button" : undefined}
              className={cx("kpi", k.filter && k.filter !== "all" && filter === k.filter && "is-active")}
              onClick={k.filter ? () => applyFilter(k.filter) : undefined}
              title={k.filter ? `Show ${k.label.toLowerCase()} in the client table` : undefined}
            >
              <span className="kpi-label">
                <span className="kpi-icon" style={toneStyle(k.tone)}>
                  <k.icon size={15} aria-hidden />
                </span>
                {k.label}
                {k.source && <SourceTag source={k.source} compact />}
              </span>
              <span className="kpi-row">
                <span className="kpi-value">{k.value}</span>
                <Sparkline data={trend.spark} tone={k.tone === "info" || k.tone === "neutral" ? "accent" : k.tone} />
              </span>
              <span className={cx("kpi-delta", trend.good ? "is-good" : "is-bad")}>
                <Arrow size={14} aria-hidden />
                {trend.delta}
              </span>
            </Tag>
          );
        })}
      </div>

      <div className="dash-grid">
        {isArchived ? (
          <ArchivedSeasonCard taxYear={taxYear} season={season} />
        ) : (
          <TeamWorkload selected={selectedPreparer} onSelect={(name) => applyFilter(name ? `assignee:${name}` : "all")} />
        )}

        <Card
          title={isArchived ? "Season highlights" : "Activity"}
          subtitle={isArchived ? `What stood out in tax year ${taxYear}` : "Grouped by event — open one to see every client"}
          actions={isArchived ? <Badge tone="neutral">Archived</Badge> : <Badge tone="success" dot>Live</Badge>}
        >
          <div className="activity scroll-y" style={{ maxHeight: 640 }}>
            {feed.map((a) => {
              const [Icon, tone] = ACTIVITY_ICONS[a.icon] || ACTIVITY_ICONS.user;
              const isNew = typeof a.time === "number" && Date.now() - a.time < 60 * 1000;
              const count = a.batch?.items.length;
              const body = (
                <>
                  <span className="activity-icon" style={toneStyle(tone)}>
                    <Icon size={15} aria-hidden />
                  </span>
                  <span className="activity-body">
                    <span className="activity-text">
                      <b>{a.actor}</b> {a.text}
                    </span>
                    <span className="activity-time">
                      {fmtWhen(a.time)} <SourceTag source={a.source} compact />
                    </span>
                  </span>
                  {count > 0 && (
                    <span className="activity-more">
                      View {count > 1 ? `all ${count.toLocaleString()}` : ""}
                      <ChevronRight size={14} aria-hidden />
                    </span>
                  )}
                </>
              );
              return a.batch ? (
                <button key={a.id} type="button" className={cx("activity-item", "is-clickable", isNew && "is-new")} onClick={() => setOpenActivity(a)}>
                  {body}
                </button>
              ) : (
                <div key={a.id} className={cx("activity-item", isNew && "is-new")}>
                  {body}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div ref={tableRef} style={{ scrollMarginTop: 16 }}>
        <div className="section-label" style={{ fontSize: 12 }}>
          <span>Clients · tax year {taxYear}</span>
          <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>
            {isArchived ? "Read-only — closed season" : "Status and assignee are editable inline"}
          </span>
        </div>
        <ClientTable key={taxYear} filter={filter} onFilterChange={setFilter} />
      </div>

      {openActivity && <ActivityModal key={openActivity.id} item={openActivity} onClose={() => setOpenActivity(null)} />}
    </div>
  );
}

function ArchivedSeasonCard({ taxYear, season }) {
  const types = Object.entries(season.byType);
  const max = Math.max(...types.map(([, n]) => n));
  return (
    <Card
      title="Season summary"
      subtitle={season.closedLabel}
      actions={<Badge tone="success">{Math.round((season.filed / season.capacity) * 100)}% of capacity</Badge>}
    >
      <div className="season-head">
        <div className="season-big">
          {season.filed.toLocaleString()} <span>of {season.capacity.toLocaleString()} capacity filed</span>
        </div>
      </div>
      <ProgressBar size="lg" total={season.capacity} label={`${season.filed} returns filed`} segments={[{ value: season.filed, tone: "success", label: "Filed" }]} />
      <div className="legend">
        <span className="legend-item"><span className="legend-swatch tone-success" />Filed</span>
        <span className="legend-item"><span className="legend-swatch tone-muted" />Unused capacity</span>
      </div>

      <div className="divider" />
      <div className="section-label">
        <span>Returns by type · tax year {taxYear}</span>
      </div>
      <div className="status-rows">
        {types.map(([type, n]) => (
          <div key={type} className="status-row" style={{ gridTemplateColumns: "minmax(0, 190px) 1fr 56px" }}>
            <span className="status-row-label">
              <span className="tag">{type}</span>
              {RETURN_TYPE_LABELS[type]}
            </span>
            <span className="status-row-track">
              <span className="status-row-bar tone-accent" style={{ width: `${(n / max) * 100}%`, display: "block" }} />
            </span>
            <span className="status-row-count">{n.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
