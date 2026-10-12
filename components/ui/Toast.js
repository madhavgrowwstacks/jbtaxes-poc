"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cx } from "../../lib/utils";

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: AlertTriangle };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  // toast("Saved") or toast({ title, description, tone, action: { label, onClick }, duration })
  const toast = useCallback(
    (opts) => {
      const t = typeof opts === "string" ? { title: opts } : opts;
      const id = Date.now() + Math.random();
      setToasts((list) => [...list.slice(-3), { tone: "success", ...t, id }]);
      timers.current[id] = setTimeout(() => dismiss(id), t.duration || (t.action ? 6500 : 4200));
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] || Info;
          return (
            <div key={t.id} className={cx("toast", `toast-${t.tone}`)} role="status">
              <Icon size={18} className="toast-icon" aria-hidden />
              <div className="toast-text">
                <div className="toast-title">{t.title}</div>
                {t.description && <div className="toast-desc">{t.description}</div>}
              </div>
              {t.action && (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => {
                    t.action.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
