import type { PropsWithChildren } from 'react';

interface SectionCardProps {
  title: string;
  description: string;
}

export function SectionCard({ title, description, children }: PropsWithChildren<SectionCardProps>) {
  return (
    <section className="rounded-[1.75rem] border border-line bg-white p-6 shadow-panel">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-slate">{description}</p>
      </div>
      {children}
    </section>
  );
}
