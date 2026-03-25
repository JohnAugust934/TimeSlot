import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'default' | 'accent' | 'success';
}

const toneMap = {
  default: 'bg-white',
  accent: 'bg-[#fff4eb]',
  success: 'bg-[#eef8f2]',
};

export function StatCard({ label, value, helper, tone = 'default' }: StatCardProps) {
  return (
    <div className={cn('rounded-[1.5rem] border border-line p-5 shadow-panel', toneMap[tone])}>
      <p className="text-sm font-medium text-slate">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate">{helper}</p> : null}
    </div>
  );
}
