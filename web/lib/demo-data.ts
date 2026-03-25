export const professionals = [
  { id: 'prof-1', name: 'Ana Martins', specialty: 'Fisioterapia', status: 'Ativo' },
  { id: 'prof-2', name: 'Bruno Lima', specialty: 'Estetica', status: 'Ativo' },
  { id: 'prof-3', name: 'Carla Souza', specialty: 'Atendimento clinico', status: 'Pendente' },
];

export const clients = [
  { id: 'client-1', name: 'Mariana Costa', phone: '(11) 99999-0001', email: 'mariana@email.com' },
  { id: 'client-2', name: 'Paulo Reis', phone: '(11) 99999-0002', email: 'paulo@email.com' },
  { id: 'client-3', name: 'Fernanda Melo', phone: '(11) 99999-0003', email: 'fernanda@email.com' },
];

export const services = [
  { id: 'service-1', name: 'Consulta inicial', duration: 60, active: true },
  { id: 'service-2', name: 'Retorno', duration: 30, active: true },
  { id: 'service-3', name: 'Sessao tecnica', duration: 45, active: false },
];

export const agendaItems = [
  {
    time: '08:00',
    client: 'Mariana Costa',
    professional: 'Ana Martins',
    service: 'Consulta inicial',
  },
  { time: '09:30', client: 'Paulo Reis', professional: 'Bruno Lima', service: 'Retorno' },
  {
    time: '11:00',
    client: 'Fernanda Melo',
    professional: 'Ana Martins',
    service: 'Sessao tecnica',
  },
];
