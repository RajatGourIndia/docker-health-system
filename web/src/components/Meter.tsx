interface MeterProps {
  percent: number;
  label: string;
  /** Thresholds (0-100) above which the fill escalates from accent to warning to critical. */
  warningAt?: number;
  criticalAt?: number;
}

export function Meter({ percent, label, warningAt = 70, criticalAt = 90 }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color =
    clamped >= criticalAt
      ? 'var(--status-critical)'
      : clamped >= warningAt
        ? 'var(--status-warning)'
        : 'var(--accent)';

  return (
    <div className="meter" style={{ ['--meter-color' as string]: color }}>
      <div className="meter__track">
        <div className="meter__fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="meter__label">{label}</span>
    </div>
  );
}
