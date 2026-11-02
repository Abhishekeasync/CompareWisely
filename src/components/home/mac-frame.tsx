import type { ReactNode } from "react";

type MacFrameProps = {
  title: string;
  /** Shown on the right of the title bar (path or hostname). */
  location?: string;
  children: ReactNode;
};

export function MacFrame({ title, location, children }: MacFrameProps) {
  return (
    <div className="mac-frame">
      <div className="mac-frame__chrome">
        <div className="mac-frame__controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="mac-frame__title">{title}</p>
        {location ? <span className="mac-frame__location">{location}</span> : <span aria-hidden="true" />}
      </div>
      <div className="mac-frame__viewport">{children}</div>
    </div>
  );
}

function splitComparisonTitle(title: string): [string, string] | null {
  const match = title.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (!match) return null;
  return [match[1].trim(), match[2].trim()];
}

export function ComparisonGlanceHeading({ title }: { title: string }) {
  const pair = splitComparisonTitle(title);
  if (!pair) {
    return (
      <h2 id="lead-comparison-heading" className="comparison-glance__heading comparison-glance__heading--single">
        {title}
      </h2>
    );
  }
  const [left, right] = pair;
  return (
    <h2 id="lead-comparison-heading" className="comparison-glance__heading">
      <span className="comparison-glance__heading-product">{left}</span>
      <span className="comparison-glance__heading-vs" aria-hidden="true">
        vs
      </span>
      <span className="comparison-glance__heading-product">{right}</span>
    </h2>
  );
}
