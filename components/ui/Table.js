import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cx } from "../../lib/utils";

export function Table({ children, className, minWidth }) {
  return (
    <div className="table-wrap">
      <table className={cx("table", className)} style={minWidth ? { minWidth } : undefined}>
        {children}
      </table>
    </div>
  );
}

// sort: { key, dir: "asc" | "desc" }
export function SortHeader({ label, sortKey, sort, onSort, align, width }) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      style={{ width, textAlign: align }}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button type="button" className={cx("th-sort", active && "is-active")} onClick={() => onSort(sortKey)}>
        {label}
        <Icon size={12} aria-hidden />
      </button>
    </th>
  );
}

export function Pagination({ page, pageCount, total, from, to, onPage }) {
  if (total === 0) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="pagination">
      <span className="text-2">
        Showing <b>{from}</b>–<b>{to}</b> of <b>{total}</b>
      </span>
      <div className="pagination-pages">
        <button type="button" className="page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={cx("page-btn", "page-num", p === page && "is-active")}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}
        <button type="button" className="page-btn" disabled={page === pageCount} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
