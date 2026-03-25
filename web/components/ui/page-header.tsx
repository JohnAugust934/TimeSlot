interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="max-w-2xl text-sm text-slate">{description}</p>
    </div>
  );
}
