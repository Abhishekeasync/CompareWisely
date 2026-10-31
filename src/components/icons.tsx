import type { SVGProps } from "react";
import type { SearchKind } from "@/lib/catalog";

type IconProps = SVGProps<SVGSVGElement>;

function Icon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />
  );
}

export function BrandMark() {
  return (
    <span className="brand__mark" aria-hidden="true">
      <Icon strokeWidth="2">
        <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <path d="M8 13l3 3 5-6" />
      </Icon>
    </span>
  );
}

export function SearchIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export function SunIcon() {
  return (
    <Icon className="ic-sun">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

export function MoonIcon() {
  return (
    <Icon className="ic-moon">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </Icon>
  );
}

export function MenuIcon() {
  return (
    <Icon strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </Icon>
  );
}

export function ChevronIcon() {
  return (
    <Icon strokeWidth="2">
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function CheckIcon() {
  return (
    <Icon strokeWidth="2.2">
      <path d="M5 12l4 4 10-10" />
    </Icon>
  );
}

export function MinusIcon() {
  return (
    <Icon strokeWidth="2.2">
      <path d="M6 12h12" />
    </Icon>
  );
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 2 3 6.5 7 .8-5.2 4.7 1.4 6.9L12 17.6 5.8 21l1.4-6.9L2 9.3l7-.8z" />
    </svg>
  );
}

export function HomeIcon() {
  return (
    <Icon strokeWidth="1.8">
      <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
    </Icon>
  );
}

export function CompareIcon() {
  return (
    <Icon strokeWidth="1.8">
      <path d="M7 4v16M17 4v16M4 8l3-3 3 3" />
    </Icon>
  );
}

export function BlogIcon() {
  return (
    <Icon strokeWidth="1.8">
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8M8 13h5" />
    </Icon>
  );
}

export function UpdatesIcon() {
  return (
    <Icon strokeWidth="1.8">
      <path d="M12 3v18M5 8l7-5 7 5" />
    </Icon>
  );
}

export function TargetIcon() {
  return (
    <Icon strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </Icon>
  );
}

export function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 3h3l-7 8 8 10h-6l-5-6-5 6H3l8-9L3 3h6l4 5z" />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4h4v16H4zM6 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4M10 8h4v2.2c.8-1.4 2-2.2 3.6-2.2 2.6 0 4.4 1.7 4.4 5.2V20h-4v-6c0-1.6-.7-2.6-2-2.6-1.2 0-2 .8-2 2.6v6h-4z" />
    </svg>
  );
}

export function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-2.2-.2-3.7-.5-4.6-.3-.9-.9-1.5-1.8-1.8C18 5.2 12 5.2 12 5.2s-6 0-7.7.4c-.9.3-1.5.9-1.8 1.8C2.2 8.3 2 9.8 2 12s.2 3.7.5 4.6c.3.9.9 1.5 1.8 1.8 1.7.4 7.7.4 7.7.4s6 0 7.7-.4c.9-.3 1.5-.9 1.8-1.8.3-.9.5-2.4.5-4.6M10 15V9l5 3z" />
    </svg>
  );
}

const KIND_PATHS: Record<SearchKind, string> = {
  cmp: "M7 4v16M17 4v16M4 8l3-3 3 3M14 8l3-3 3 3M4 18l3 3 3-3M14 18l3 3 3-3",
  post: "M4 5h16v14H4zM8 9h8M8 13h5",
  upd: "M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5",
  sw: "M4 4h16v16H4z",
  tool: "M12 3v18M3 12h18",
};

export function KindIcon({ kind }: { kind: SearchKind }) {
  if (kind === "sw") {
    return (
      <Icon strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 9h6v6H9z" />
      </Icon>
    );
  }
  return (
    <Icon strokeWidth="1.8">
      <path d={KIND_PATHS[kind]} />
    </Icon>
  );
}
