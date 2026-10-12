import { RefreshCw, Sparkles } from "lucide-react";
import { cx, statusMeta } from "../../lib/utils";

// tone: neutral | info | success | warning | danger | violet
export default function Badge({ tone = "neutral", dot = false, icon: Icon, className, children, ...rest }) {
  return (
    <span className={cx("badge", `badge-${tone}`, className)} {...rest}>
      {dot && <span className="badge-dot" aria-hidden />}
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  );
}

// Where a status or event came from: synced from ProConnect, or set by the AI layer.
// `compact` shows a short "PC" / "AI" chip (for dense tables).
export function SourceTag({ source, compact = false }) {
  if (source !== "ai" && source !== "proconnect") return null;
  const ai = source === "ai";
  return (
    <span
      className={cx("src-tag", ai ? "src-ai" : "src-pc", compact && "is-compact")}
      title={ai ? "Set automatically by the AI document check" : "Synced with ProConnect"}
    >
      {ai ? <Sparkles size={10} aria-hidden /> : <RefreshCw size={10} aria-hidden />}
      {compact ? (ai ? "AI" : "PC") : ai ? "AI" : "ProConnect"}
      <span className="sr-only">{ai ? " — set by AI" : " — from ProConnect"}</span>
    </span>
  );
}

export function StatusBadge({ status, showSource = false, compact = true }) {
  const s = statusMeta(status);
  return (
    <span className="status-badge">
      <Badge tone={s.tone} dot>
        {s.label}
      </Badge>
      {showSource && <SourceTag source={s.source} compact={compact} />}
    </span>
  );
}

export function AIBadge({ children = "AI-generated" }) {
  return (
    <Badge tone="violet" icon={Sparkles}>
      {children}
    </Badge>
  );
}
