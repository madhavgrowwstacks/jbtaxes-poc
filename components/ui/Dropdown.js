"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cx } from "../../lib/utils";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Floating panel anchored to a trigger. Rendered in a portal with fixed
// positioning so it is never clipped by scrolling tables or cards.
export function Popover({ open, onClose, anchorRef, align = "start", width, className, role, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      const menu = ref.current;
      if (!a || !menu) return;
      const mh = menu.offsetHeight;
      const mw = menu.offsetWidth;
      let top = a.bottom + 6;
      if (top + mh > window.innerHeight - 8 && a.top - mh - 6 > 8) top = a.top - mh - 6;
      let left = align === "end" ? a.right - mw : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
      setPos({ top, left, minWidth: a.width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
      closeRef.current();
    };
    // Capture phase so Escape closes only the popover, not a modal underneath it.
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        anchorRef.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = [...(ref.current?.querySelectorAll("[data-item]:not([disabled])") || [])];
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const n = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
      items[n].focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    const raf = requestAnimationFrame(() => {
      const el = ref.current?.querySelector("[data-selected='true']") || ref.current?.querySelector("[data-item]");
      el?.focus({ preventScroll: true });
    });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
      cancelAnimationFrame(raf);
    };
  }, [open, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      role={role}
      className={cx("popover", className)}
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        minWidth: width ? undefined : pos?.minWidth,
        width,
        visibility: pos ? "visible" : "hidden",
      }}
      // React events bubble through portals; keep clicks from reaching e.g. a clickable table row.
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

// Select-style dropdown. options: [{ value, label, hint?, render?, disabled? }] or strings.
// Non-selectable rows: { header: "Section title" } and { divider: true }.
export function Select({
  value,
  options,
  onChange,
  renderValue,
  variant = "default", // default | cell
  size = "md",
  ariaLabel,
  placeholder = "Select…",
  align = "start",
  menuWidth,
  className,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opts = options.map((o) => (typeof o === "string" || typeof o === "number" ? { value: o, label: String(o) } : o));
  const selected = opts.find((o) => o.value === value);

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={cx("select", `select-${variant}`, size === "sm" && "select-sm", open && "is-open", className)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="select-value">
          {selected ? (renderValue ? renderValue(selected) : selected.label) : <span className="text-3">{placeholder}</span>}
        </span>
        <ChevronDown size={14} className="select-chevron" aria-hidden />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={ref} align={align} width={menuWidth} role="listbox">
        {opts.map((o, i) => {
          if (o.header) return <div key={`h${i}`} className="menu-section" role="presentation">{o.header}</div>;
          if (o.divider) return <div key={`d${i}`} className="menu-divider" role="separator" />;
          const isSel = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={isSel}
              data-item
              data-selected={isSel}
              disabled={o.disabled}
              className={cx("menu-item", isSel && "is-selected")}
              onClick={() => {
                setOpen(false);
                ref.current?.focus();
                if (!isSel) onChange(o.value);
              }}
            >
              <span className="menu-item-label">{o.render || o.label}</span>
              {o.hint && <span className="menu-hint">{o.hint}</span>}
              <Check size={14} className="menu-check" aria-hidden style={{ opacity: isSel ? 1 : 0 }} />
            </button>
          );
        })}
      </Popover>
    </>
  );
}

// Action menu. `trigger` is a render prop receiving the props to spread onto a button.
export function Menu({ trigger, items, header, align = "end", width = 232 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  return (
    <>
      {trigger({
        ref,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        onClick: (e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        },
      })}
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={ref} align={align} width={width} role="menu">
        {header}
        {items.map((it, i) =>
          it.divider ? (
            <div key={i} className="menu-divider" role="separator" />
          ) : (
            <button
              key={i}
              type="button"
              role="menuitem"
              data-item
              className={cx("menu-item", it.danger && "is-danger")}
              onClick={() => {
                setOpen(false);
                it.onClick?.();
              }}
            >
              {it.icon && <it.icon size={15} aria-hidden />}
              <span className="menu-item-label">{it.label}</span>
              {it.hint && <span className="menu-hint">{it.hint}</span>}
            </button>
          )
        )}
      </Popover>
    </>
  );
}
