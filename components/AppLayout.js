"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  Bell,
  BellRing,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  PhoneCall,
  RotateCcw,
  ScanSearch,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useStore } from "./store";
import { Avatar, Kbd, Menu, Popover, ProgressBar, Select, useToast } from "./ui";
import { CHASE, CURRENT_TAX_YEAR, CURRENT_USER, RETURN_TYPE_LABELS, TAX_YEARS } from "../lib/data";
import { cx, fmtWhen } from "../lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/" },
  { href: "/clients", label: "Clients", icon: Users, match: (p) => p.startsWith("/clients") || p.startsWith("/client/") },
  { href: "/ai-check", label: "AI Doc Check", icon: ScanSearch, match: (p) => p.startsWith("/ai-check"), badge: "ai" },
  { href: "/chase", label: "Chase Queue", icon: PhoneCall, match: (p) => p.startsWith("/chase"), badge: "calls" },
  { href: "/intake", label: "Intake Forms", icon: ClipboardList, match: (p) => p.startsWith("/intake") },
  { href: "/review/sarah-mitchell", label: "AI Reviews", icon: Sparkles, match: (p) => p.startsWith("/review") },
  { href: "/reminders", label: "Reminders", icon: BellRing, match: (p) => p.startsWith("/reminders") },
];
const SETTINGS_NAV = { href: "/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/settings") };

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { chase, clients, totals, season, taxYear, isArchived, actions } = useStore();

  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const callsLeft = isArchived ? 0 : CHASE.noResponse.filter((r) => !chase.called[r.id]).length;
  // Sample clients the AI has cleared and nobody has picked up yet.
  const aiReady = isArchived ? 0 : clients.filter((c) => c.status === "ai_verified").length;
  const onboarded = season.closed ? season.filed : Object.values(totals).reduce((a, b) => a + b, 0);
  const filed = season.closed ? season.filed : totals.filed;

  const navLink = (item) => {
    const active = item.match(pathname);
    const badge = item.badge === "calls" ? callsLeft : item.badge === "ai" ? aiReady : 0;
    return (
      <Link key={item.href} href={item.href} className={cx("nav-item", active && "is-active")} aria-current={active ? "page" : undefined}>
        <item.icon size={18} aria-hidden />
        <span>{item.label}</span>
        {badge > 0 && (
          <span className={cx("nav-badge", item.badge === "ai" && "is-ai")} title={item.badge === "ai" ? "AI-verified, waiting for a human" : undefined}>
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="app">
      <aside className={cx("sidebar", drawerOpen && "is-open")} aria-label="Main navigation">
        <div className="sidebar-brand">
          <div className="brand-mark">JB</div>
          <div className="brand-text">
            <div className="brand-name">JB Taxes</div>
            <div className="brand-sub">Operations</div>
          </div>
          <button type="button" className="icon-btn sidebar-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Workspace</div>
          {NAV.map(navLink)}
          <div className="nav-section">Firm</div>
          {navLink(SETTINGS_NAV)}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-season">
            <div className="sidebar-season-row">
              <span>TY {taxYear} {season.closed ? "· closed" : "progress"}</span>
              <b>{Math.round((onboarded / season.capacity) * 100)}%</b>
            </div>
            <ProgressBar
              size="sm"
              label="Season progress"
              total={season.capacity}
              segments={[
                { value: filed, tone: "success" },
                { value: onboarded - filed, tone: "accent" },
              ]}
            />
            <div className="sidebar-season-sub">
              {season.closed
                ? `${filed.toLocaleString()} returns filed`
                : `${onboarded.toLocaleString()} of ${season.capacity.toLocaleString()} returns`}
            </div>
          </div>
          <div className="proto-label">Prototype — sample data</div>
        </div>
      </aside>
      {drawerOpen && <div className="sidebar-scrim" onClick={() => setDrawerOpen(false)} aria-hidden />}

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn topbar-menu" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <MenuIcon size={20} />
          </button>
          <GlobalSearch />
          <div className="topbar-right">
            <span className="proto-pill">Prototype</span>
            <YearSelect />
            <Notifications />
            <UserMenu />
          </div>
        </header>
        <main className="content" id="content">
          {isArchived && (
            <div className="archive-banner" role="status">
              <Archive size={16} aria-hidden />
              <span>
                You're viewing <b>tax year {taxYear}</b> — {season.closedLabel.charAt(0).toLowerCase() + season.closedLabel.slice(1)}. Records
                are read-only.
              </span>
              <button type="button" className="link-btn" onClick={() => actions.setTaxYear(CURRENT_TAX_YEAR)}>
                Back to {CURRENT_TAX_YEAR}
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

const PAGES = [...NAV, SETTINGS_NAV].map((n) => ({ href: n.href, label: n.label, icon: n.icon }));

function isTypingTarget(el) {
  return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

function GlobalSearch() {
  const { clients } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isTypingTarget(e.target))) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const term = q.trim().toLowerCase();
  const results = term
    ? [
        ...clients
          .filter((c) => [c.name, c.type, c.assignee, RETURN_TYPE_LABELS[c.type]].some((v) => v.toLowerCase().includes(term)))
          .slice(0, 6)
          .map((c) => ({ key: c.id, href: `/client/${c.id}`, label: c.name, meta: `${c.type} · ${c.assignee}`, avatar: c.name })),
        ...PAGES.filter((p) => p.label.toLowerCase().includes(term)).map((p) => ({ key: p.href, href: p.href, label: p.label, meta: "Page", icon: p.icon })),
      ]
    : [];

  const go = (r) => {
    if (!r) return;
    router.push(r.href);
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="search" ref={wrapRef}>
      <Search size={16} className="search-icon" aria-hidden />
      <input
        ref={inputRef}
        className="search-input"
        type="search"
        placeholder="Search clients, return types, preparers…"
        aria-label="Search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            go(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />
      <span className="search-kbd">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </span>
      {open && term && (
        <div className="search-results" role="listbox">
          {results.length === 0 ? (
            <div className="search-empty">No matches for “{q}”</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.key}
                type="button"
                role="option"
                aria-selected={i === active}
                className={cx("search-result", i === active && "is-active")}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
              >
                {r.avatar ? <Avatar name={r.avatar} size={26} /> : <span className="search-result-icon"><r.icon size={15} /></span>}
                <span className="search-result-label">{r.label}</span>
                <span className="search-result-meta">{r.meta}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const YEAR_OPTIONS = TAX_YEARS.map((y) => ({
  value: y.year,
  label: `Tax year ${y.year}`,
  render: (
    <span className="year-option">
      <span>Tax year {y.year}</span>
      <span className="year-option-note">{y.note}</span>
    </span>
  ),
  hint: y.status === "current" ? "Current" : "Closed",
}));

function YearSelect() {
  const { taxYear, actions } = useStore();
  const toast = useToast();
  return (
    <Select
      value={taxYear}
      options={YEAR_OPTIONS}
      onChange={(y) => {
        actions.setTaxYear(y);
        toast(
          y === CURRENT_TAX_YEAR
            ? { title: `Back to tax year ${y}`, description: "Live season — everything is editable." }
            : { tone: "info", title: `Viewing tax year ${y}`, description: "Closed season — records are read-only." }
        );
      }}
      renderValue={(o) => (
        <>
          <CalendarDays size={15} aria-hidden />
          <span className="year-select-word">Tax year</span> {o.value}
        </>
      )}
      ariaLabel="Tax season year"
      size="sm"
      align="end"
      menuWidth={290}
      className="year-select"
    />
  );
}

function Notifications() {
  const { notifications, actions } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={cx("icon-btn", "topbar-icon", open && "is-active")}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={19} />
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={ref} align="end" width={360} className="notif-pop">
        <div className="notif-head">
          <b>Notifications</b>
          {unread > 0 && (
            <button type="button" className="link-btn" onClick={actions.markAllNotificationsRead}>
              Mark all as read
            </button>
          )}
        </div>
        <div className="notif-list">
          {notifications.slice(0, 8).map((n) => (
            <button
              key={n.id}
              type="button"
              data-item
              className={cx("notif-item", !n.read && "is-unread")}
              onClick={() => {
                actions.markNotificationRead(n.id);
                setOpen(false);
                router.push(n.href);
              }}
            >
              <span className="notif-dot" aria-hidden />
              <span className="notif-text">
                <span className="notif-title">{n.title}</span>
                <span className="notif-body">{n.body}</span>
                <span className="notif-time">{fmtWhen(n.time)}</span>
              </span>
            </button>
          ))}
        </div>
      </Popover>
    </>
  );
}

function UserMenu() {
  const router = useRouter();
  const toast = useToast();
  const { actions } = useStore();

  return (
    <Menu
      header={
        <div className="menu-header">
          <div className="menu-header-name">{CURRENT_USER.name}</div>
          <div className="menu-header-sub">{CURRENT_USER.email}</div>
        </div>
      }
      items={[
        { label: "Settings", icon: Settings, onClick: () => router.push("/settings") },
        { label: "Keyboard shortcuts", icon: HelpCircle, onClick: () => toast({ tone: "info", title: "Shortcuts", description: "Ctrl+K or / to search · Esc to close dialogs" }) },
        { divider: true },
        {
          label: "Reset sample data",
          icon: RotateCcw,
          onClick: () => {
            actions.reset();
            toast({ title: "Sample data restored", description: "All demo edits were cleared." });
          },
        },
        { label: "Sign out", icon: LogOut, danger: true, onClick: () => toast({ tone: "info", title: "Sign-out is disabled in this prototype" }) },
      ]}
      trigger={(props) => (
        <button type="button" className="user-btn" aria-label="Account menu" {...props}>
          <Avatar name={CURRENT_USER.name} size={32} />
          <span className="user-btn-text">
            <span className="user-btn-name">{CURRENT_USER.name}</span>
            <span className="user-btn-role">{CURRENT_USER.role}</span>
          </span>
          <ChevronDown size={14} className="user-btn-chev" aria-hidden />
        </button>
      )}
    />
  );
}
