import { cx } from "../../lib/utils";

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cx("switch", checked && "is-on")}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
    >
      <span className="switch-thumb" />
    </button>
  );
}

// options: [{ value, label, icon? }] or strings
export function Segmented({ value, options, onChange, ariaLabel, block = false, size = "md" }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className={cx("segmented", block && "is-block", size === "sm" && "segmented-sm")} role="radiogroup" aria-label={ariaLabel}>
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={cx("segmented-item", value === o.value && "is-active")}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <o.icon size={14} aria-hidden />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, htmlFor, children, className }) {
  return (
    <div className={cx("field", error && "has-error", className)}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? <div className="field-error">{error}</div> : hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  );
}

export function Sparkline({ data, tone = "accent" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  return (
    <div className={cx("spark", `spark-${tone}`)} aria-hidden>
      {data.map((v, i) => (
        <span key={i} className={i === data.length - 1 ? "is-last" : undefined} style={{ height: `${28 + ((v - min) / (max - min || 1)) * 72}%` }} />
      ))}
    </div>
  );
}

// segments: [{ value, tone, label }]
export function ProgressBar({ segments, total, size = "md", label }) {
  const sum = total ?? segments.reduce((a, s) => a + s.value, 0);
  return (
    <div className={cx("progress", size === "sm" && "progress-sm", size === "lg" && "progress-lg")} role="img" aria-label={label}>
      {segments.map((s, i) => (
        <span key={i} className={cx("progress-seg", `tone-${s.tone}`)} style={{ width: `${(s.value / (sum || 1)) * 100}%` }} title={s.label ? `${s.label}: ${s.value}` : undefined} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty-icon">
          <Icon size={22} aria-hidden />
        </div>
      )}
      <div className="empty-title">{title}</div>
      {children && <div className="empty-text">{children}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}
