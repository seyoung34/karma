import type { ReactNode } from "react";

export function IconButton({
  title,
  onClick,
  children,
  disabled
}: {
  title: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button className="chrome-icon" title={title} aria-label={title} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
