import { AlertTriangle, CheckCircle2, CircleSlash2, Info, ShieldAlert, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export type ResultTone = 'success' | 'warning' | 'error' | 'info' | 'permission' | 'incomplete';

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  permission: ShieldAlert,
  incomplete: CircleSlash2,
};

export function ResultState({ tone, label, children, announce = true }: { tone: ResultTone; label: string; children: ReactNode; announce?: boolean }) {
  const Icon = icons[tone];
  return (
    <div className={`result-state state-${tone}`} role={announce ? (tone === 'error' ? 'alert' : 'status') : undefined}>
      <Icon aria-hidden="true" />
      <div><span className="state-label">{label}</span><div>{children}</div></div>
    </div>
  );
}
