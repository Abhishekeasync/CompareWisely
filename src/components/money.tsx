export function Money({ value }: { value: string }) {
  const parts = value.split("₹");
  if (parts.length === 1) return value;

  return parts.map((part, index) => (
    <span key={index}>
      {index > 0 ? <span className="rupee">₹</span> : null}
      {part}
    </span>
  ));
}
