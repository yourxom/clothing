import type { SVGProps } from "react";

export function AureliaLogo({
  size = 24,
  color = "#c85b5b",
  className,
  style,
  ...props
}: {
  size?: number;
  color?: string;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, display: "inline-block", ...style }}
      aria-hidden="true"
      {...props}
    >
      <path
        fill={color}
        d="M 7 2 C 2 7 1 15 1.5 26 C 2 29 4 30 7 30 C 13 30 19 26 29 18 C 21 18 15.5 16 12.5 14.5 C 17 11 20.5 7.5 24 3.5 C 17 5.5 11.5 4 7 2 Z"
      />
    </svg>
  );
}
