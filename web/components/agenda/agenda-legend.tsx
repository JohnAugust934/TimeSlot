const items = [
  {
    label: 'Livre',
    color: 'bg-[#e8f5e9]',
    description: 'Horario dentro da disponibilidade e sem conflito.',
  },
  {
    label: 'Ocupado',
    color: 'bg-[#ffe4d6]',
    description: 'Horario com agendamento ja registrado.',
  },
  {
    label: 'Indisponivel',
    color: 'bg-[#ece7df]',
    description: 'Fora da disponibilidade ou bloqueado pelo profissional.',
  },
];

export function AgendaLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-2 rounded-xl border border-line bg-white/70 px-3 py-2">
          <span className={`mt-1 h-3 w-3 rounded-full ${item.color}`} />
          <div>
            <p className="text-xs font-semibold text-ink">{item.label}</p>
            <p className="text-[11px] text-slate">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
