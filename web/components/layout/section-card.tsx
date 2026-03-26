import type { PropsWithChildren } from 'react';

interface SectionCardProps {
  title: string;
  description: string;
}

export function SectionCard({ title, description, children }: PropsWithChildren<SectionCardProps>) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-line bg-white p-4 shadow-panel md:rounded-[1.5rem] md:p-5 lg:rounded-[1.75rem] lg:p-6">
      <div className="mb-4 md:mb-5">
        <h2 className="text-base font-semibold text-ink md:text-lg">{title}</h2>
        <p className="mt-1 text-sm text-slate">{description}</p>
      </div>
      {children}
    </section>
  );
}
