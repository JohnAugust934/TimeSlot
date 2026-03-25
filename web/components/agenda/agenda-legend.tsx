const items = [
  { label: 'Livre', color: 'bg-[#e8f5e9]' },
  { label: 'Ocupado', color: 'bg-[#ffe4d6]' },
  { label: 'Indisponivel', color: 'bg-[#ece7df]' },
];

export function AgendaLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs text-slate">
          <span className={`h-3 w-3 rounded-full ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
