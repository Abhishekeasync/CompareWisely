import { CheckIcon, MinusIcon } from "@/components/icons";

/**
 * Dynamic value cell for the comparison matrix.
 * Accepts database-sourced ValueKind enums instead of the legacy static FeatureValue type.
 */
type Props = {
  valueKind?: string;
  textValue?: string | null;
  highlight?: boolean;
};

export function CompareValueCell({ valueKind, textValue, highlight }: Props) {
  const className = `vs__cell${highlight ? " vs__cell--diff" : ""}`;

  if (!valueKind || valueKind === "UNAVAILABLE" || valueKind === "UNKNOWN") {
    return (
      <div className={className} role="cell">
        <span className="compare-na muted">
          {valueKind === "UNKNOWN" ? "Unknown" : "Not listed"}
        </span>
      </div>
    );
  }

  if (valueKind === "YES") {
    return (
      <div className={className} role="cell">
        {textValue ? (
          <span style={{ fontWeight: 500 }}>{textValue}</span>
        ) : (
          <span className="compare-bool compare-bool--yes">
            <CheckIcon />
            <span className="sr-only">Yes</span>
            <span aria-hidden="true">Yes</span>
          </span>
        )}
      </div>
    );
  }

  if (valueKind === "NO") {
    return (
      <div className={className} role="cell">
        <span className="compare-bool compare-bool--no muted">
          <MinusIcon />
          <span className="sr-only">No</span>
          <span aria-hidden="true">No</span>
        </span>
      </div>
    );
  }

  if (valueKind === "PARTIAL") {
    return (
      <div className={className} role="cell">
        <span
          style={{
            color: "#d97706",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          {textValue || "Partial"}
        </span>
      </div>
    );
  }

  if (valueKind === "PAID_ADDON") {
    return (
      <div className={className} role="cell">
        <span
          style={{
            color: "var(--primary-text)",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          {textValue || "Paid Add-on"}
        </span>
      </div>
    );
  }

  // Fallback: render textValue or dash
  return (
    <div className={className} role="cell">
      {textValue || "—"}
    </div>
  );
}
