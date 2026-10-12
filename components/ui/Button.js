import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cx } from "../../lib/utils";

// variant: primary | secondary | ghost | danger   size: sm | md | lg
export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  block = false,
  href,
  className,
  children,
  ...rest
}) {
  const iconSize = size === "sm" ? 14 : 16;
  const cls = cx(
    "btn",
    `btn-${variant}`,
    size !== "md" && `btn-${size}`,
    block && "btn-block",
    !children && "btn-icon-only",
    className
  );
  const content = (
    <>
      {loading ? <Loader2 size={iconSize} className="spin" aria-hidden /> : Icon ? <Icon size={iconSize} aria-hidden /> : null}
      {children}
      {IconRight && <IconRight size={iconSize} aria-hidden />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" {...rest} className={cls} disabled={loading || rest.disabled}>
      {content}
    </button>
  );
}
