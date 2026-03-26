# TimeSlot MVP Checklist

## Escopo MVP (entrega agora)
- [x] Autenticacao web com login/logout e protecao de rotas
- [x] Backend NestJS + Prisma com modulos principais de dominio
- [x] Seed de desenvolvimento com usuario administrador
- [x] Frontend conectado ao backend (sem dados mockados) para:
- [x] Dashboard operacional
- [x] Profissionais (listar, criar, editar, desativar)
- [x] Clientes (listar, criar, editar, desativar)
- [x] Servicos (listar, criar, editar, desativar)
- [x] Agenda (dia/semana com filtro por profissional)
- [x] Agendamentos (listar, criar, cancelar, remarcar, atualizar status)
- [x] Tratamento de erros padronizado no frontend
- [x] Validacao final do build e lint

## Pos-MVP (guardar para etapas seguintes)
- [ ] RBAC refinado por tela/acao no frontend
- [x] Tela dedicada para disponibilidade semanal
- [x] Tela dedicada para bloqueios de agenda
- [ ] Vinculo profissional-servico com precificacao por unidade
- [ ] Confirmacao ativa com notificacao (WhatsApp/e-mail/SMS)
- [ ] Historico de alteracoes em timeline visual completa
- [ ] Filtros avancados e exportacao CSV/PDF
- [ ] Testes automatizados E2E (backend + frontend)
- [ ] Observabilidade (logs estruturados, traces, alertas)
- [ ] Hardening de seguranca para producao (rate limit, CSRF strategy, auditoria)

