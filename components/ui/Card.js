import { cx } from "../../lib/utils";

export default function Card({ title, subtitle, actions, children, className, bodyClassName, pad = true, as: Tag = "section", ...rest }) {
  return (
    <Tag className={cx("card", className)} {...rest}>
      {(title || actions) && (
        <header className="card-head">
          <div className="card-head-text">
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className={cx(pad && "card-body", bodyClassName)}>{children}</div>
    </Tag>
  );
}
