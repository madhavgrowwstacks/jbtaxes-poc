import { avatarColor, cx, initials } from "../../lib/utils";

export default function Avatar({ name, size = 32, className }) {
  return (
    <span
      className={cx("avatar", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: avatarColor(name) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
