import type { SVGProps } from "react";

type FixoraMarkProps = SVGProps<SVGSVGElement> & {
  size?: number;
  variant?: "default" | "inverse";
};

export function FixoraMark({ size = 36, variant = "default", ...props }: FixoraMarkProps) {
  const base = variant === "inverse" ? "#E8E2D3" : "#173B3B";
  const detail = variant === "inverse" ? "#173B3B" : "#E8E2D3";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      focusable="false"
      {...props}
    >
      <path
        d="M8.2 13.3 17.5 6.8l6.5 4.7 6.5-4.7 9.3 6.5-2.1 15.1C36.6 36 30.8 41 24 44c-6.8-3-12.6-8-13.7-15.6L8.2 13.3Z"
        fill={base}
      />
      <path
        d="m17.5 6.8 6.5 4.7 6.5-4.7 4.2 2.9-4.3 8.2-6.4 3.4-6.4-3.4-4.3-8.2 4.2-2.9Z"
        fill={detail}
      />
      <path
        d="m13.3 18.3 7.4 2.6 3.3 7.2-5.2 2.2-6.7-5.8-1-5.1 2.2-1.1Z"
        fill={detail}
      />
      <path
        d="m34.7 18.3-7.4 2.6-3.3 7.2 5.2 2.2 6.7-5.8 1-5.1-2.2-1.1Z"
        fill={detail}
      />
      <path d="m18.2 24.2 3.1 1.4-1.1 2.1-3.2-1.1 1.2-2.4Z" fill={variant === "inverse" ? "#E8E2D3" : "#173B3B"}/>
      <path d="m29.8 24.2-3.1 1.4 1.1 2.1 3.2-1.1-1.2-2.4Z" fill="#173B3B"/>
      <path d="m20.4 32.1 3.6-2.3 3.6 2.3-3.6 3.1-3.6-3.1Z" fill="#C47A56"/>
      <path d="M24 35.2v3.1" stroke="#E8E2D3" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M8.2 13.3 4.8 18l3.4 1.8M39.8 13.3l3.4 4.7-3.4 1.8" stroke="#C47A56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
