import type { SVGProps } from "react";

export type FixoraIconName =
  | "grid" | "home" | "calculator" | "scale" | "receipt" | "package"
  | "layers" | "clock" | "user" | "support" | "shield" | "book"
  | "file" | "lock" | "menu" | "plus" | "close" | "arrow-up-right";

type FixoraIconProps = SVGProps<SVGSVGElement> & {
  name: FixoraIconName;
  size?: number;
};

function IconShape({ name }: { name: FixoraIconName }) {
  switch (name) {
    case "grid":
      return <><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/></>;
    case "home":
      return <><path d="m3.5 10 8.5-6.5 8.5 6.5"/><path d="M5.5 9.5v10.2h13V9.5M9.5 19.7v-6.2h5v6.2"/></>;
    case "calculator":
      return <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 3h2m4 0h2"/></>;
    case "scale":
      return <><path d="M12 3v17M7 20h10M5 7h14"/><path d="m5 7-3 6h6L5 7Zm14 0-3 6h6l-3-6Z"/></>;
    case "receipt":
      return <><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8v-17Z"/><path d="M9 8h6M9 12h6M9 16h3"/></>;
    case "package":
      return <><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z"/><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21M8 5.1l8.3 4.6"/></>;
    case "layers":
      return <><path d="m12 3 9 4.8-9 4.8-9-4.8L12 3Z"/><path d="m3 12 9 4.8 9-4.8M3 16.2l9 4.8 9-4.8"/></>;
    case "clock":
      return <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></>;
    case "user":
      return <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.8-3.6 3.3-5.5 7.5-5.5s6.7 1.9 7.5 5.5"/></>;
    case "support":
      return <><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="12" width="4" height="6" rx="1.5"/><rect x="17" y="12" width="4" height="6" rx="1.5"/><path d="M17 19c-.8 1.2-2.3 2-4.5 2H11"/></>;
    case "shield":
      return <><path d="M12 3 20 6v5.5c0 4.7-3 7.7-8 9.5-5-1.8-8-4.8-8-9.5V6l8-3Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></>;
    case "book":
      return <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h6"/></>;
    case "file":
      return <><path d="M6 3.5h8l4 4V20H6V3.5Z"/><path d="M14 3.5v4h4M9 12h6m-6 3h6"/></>;
    case "lock":
      return <><rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>;
    case "menu":
      return <><path d="M4 6.5h16M4 12h16M4 17.5h16"/></>;
    case "plus":
      return <><path d="M12 4v16M4 12h16"/></>;
    case "close":
      return <><path d="m6 6 12 12M18 6 6 18"/></>;
    case "arrow-up-right":
      return <><path d="M7 17 17 7M8 7h9v9"/></>;
  }
}

export function FixoraIcon({ name, size = 18, ...props }: FixoraIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <IconShape name={name} />
    </svg>
  );
}
