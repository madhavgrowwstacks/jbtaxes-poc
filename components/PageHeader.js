import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHeader({ title, description, actions, breadcrumbs, children }) {
  return (
    <div className="page-header">
      {breadcrumbs && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((b, i) => (
            <Fragment key={i}>
              {i > 0 && <ChevronRight size={14} aria-hidden />}
              {b.href ? <Link href={b.href}>{b.label}</Link> : <span aria-current="page">{b.label}</span>}
            </Fragment>
          ))}
        </nav>
      )}
      {(title || actions) && (
        <div className="page-header-row">
          <div className="page-header-text">
            {title && <h1 className="page-title">{title}</h1>}
            {description && <p className="page-desc">{description}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
