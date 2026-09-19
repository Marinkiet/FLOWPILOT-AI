import type { FindingSeverity } from '@flowpilot/shared';

const severityStyles: Record<FindingSeverity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  info: 'bg-gray-100 text-gray-600 border-gray-200',
};

interface Props {
  severity: FindingSeverity;
}

export function SeverityBadge({ severity }: Props) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded border capitalize ${severityStyles[severity]}`}
    >
      {severity}
    </span>
  );
}
