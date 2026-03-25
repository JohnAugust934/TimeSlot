# TimeSlot Backend

Backend inicial para um sistema de agendamento multiprofissional com NestJS, Prisma, PostgreSQL e JWT.

## Como iniciar

1. Instale as dependencias com `npm install`.
2. Copie `.env.example` para `.env`.
3. Ajuste `DATABASE_URL` e as variaveis de JWT.
4. Rode `npx prisma generate`.
5. Rode `npx prisma migrate dev --name init`.
6. Opcionalmente rode `npx prisma db seed`.
7. Suba o projeto com `npm run start:dev`.

## Estrutura principal

```text
.
|-- .env.example
|   Funcao: exemplo de variaveis de ambiente para desenvolvimento local.
|-- .eslintrc.cjs
|   Funcao: regras de lint para TypeScript/Nest.
|-- .eslintignore
|   Funcao: arquivos ignorados pelo ESLint.
|-- .gitignore
|   Funcao: arquivos e pastas que nao devem ir para o Git.
|-- .prettierignore
|   Funcao: arquivos ignorados pelo Prettier.
|-- .prettierrc
|   Funcao: padrao de formatacao.
|-- nest-cli.json
|   Funcao: configuracao do Nest CLI.
|-- package.json
|   Funcao: dependencias e scripts do projeto.
|-- prisma/schema.prisma
|   Funcao: schema do banco e modelos do Prisma.
|-- prisma/seed.ts
|   Funcao: seed inicial para criar um admin local.
|-- src/app.module.ts
|   Funcao: modulo raiz que conecta config, database e dominios.
|-- src/main.ts
|   Funcao: bootstrap da API com prefixo, versionamento, CORS, validacao e filtros globais.
|-- src/common/decorators/current-user.decorator.ts
|   Funcao: injeta o usuario autenticado no controller.
|-- src/common/decorators/public.decorator.ts
|   Funcao: marca rotas publicas que nao exigem JWT.
|-- src/common/filters/global-exception.filter.ts
|   Funcao: padroniza erros HTTP e Prisma.
|-- src/common/guards/jwt-auth.guard.ts
|   Funcao: guarda global de autenticacao JWT.
|-- src/common/interfaces/jwt-payload.interface.ts
|   Funcao: tipa o payload do token.
|-- src/common/interceptors/response.interceptor.ts
|   Funcao: padroniza respostas de sucesso.
|-- src/config/app.config.ts
|   Funcao: centraliza config da aplicacao.
|-- src/config/database.config.ts
|   Funcao: centraliza config do banco.
|-- src/config/env.schema.ts
|   Funcao: valida as variaveis de ambiente com zod.
|-- src/config/jwt.config.ts
|   Funcao: centraliza config do JWT.
|-- src/database/database.module.ts
|   Funcao: modulo de banco exportado globalmente.
|-- src/database/prisma.module.ts
|   Funcao: encapsula o PrismaService.
|-- src/database/prisma.service.ts
|   Funcao: cliente Prisma conectado ao ciclo de vida do Nest.
|-- src/modules/auth/auth.controller.ts
|   Funcao: endpoints de login, registro e usuario autenticado.
|-- src/modules/auth/auth.module.ts
|   Funcao: composicao do dominio de autenticacao.
|-- src/modules/auth/auth.service.ts
|   Funcao: regras de registro, login e emissao de JWT.
|-- src/modules/auth/dto/login.dto.ts
|   Funcao: valida payload de login.
|-- src/modules/auth/dto/register.dto.ts
|   Funcao: valida payload de registro.
|-- src/modules/auth/strategies/jwt.strategy.ts
|   Funcao: valida o token e carrega o usuario.
|-- src/modules/users/dto/create-user.dto.ts
|   Funcao: valida payload de criacao de usuario.
|-- src/modules/users/users.controller.ts
|   Funcao: endpoints iniciais de usuarios.
|-- src/modules/users/users.module.ts
|   Funcao: composicao do dominio de usuarios.
|-- src/modules/users/users.service.ts
|   Funcao: acesso a usuarios via Prisma.
|-- src/modules/professionals/professionals.module.ts
|   Funcao: modulo inicial de profissionais.
|-- src/modules/professionals/professionals.service.ts
|   Funcao: ponto de entrada para regras de profissionais.
|-- src/modules/clients/clients.module.ts
|   Funcao: modulo inicial de clientes.
|-- src/modules/clients/clients.service.ts
|   Funcao: ponto de entrada para regras de clientes.
|-- src/modules/units/units.module.ts
|   Funcao: modulo inicial de unidades.
|-- src/modules/units/units.service.ts
|   Funcao: ponto de entrada para regras de unidades.
|-- src/modules/services/services.module.ts
|   Funcao: modulo inicial de servicos.
|-- src/modules/services/services.service.ts
|   Funcao: ponto de entrada para regras de servicos.
|-- src/modules/availabilities/availabilities.module.ts
|   Funcao: modulo inicial de disponibilidades.
|-- src/modules/availabilities/availabilities.service.ts
|   Funcao: ponto de entrada para regras de disponibilidade.
|-- src/modules/agenda-blocks/agenda-blocks.module.ts
|   Funcao: modulo inicial de bloqueios de agenda.
|-- src/modules/agenda-blocks/agenda-blocks.service.ts
|   Funcao: ponto de entrada para regras de bloqueios.
|-- src/modules/appointments/appointments.module.ts
|   Funcao: modulo inicial de agendamentos.
|-- src/modules/appointments/appointments.service.ts
|   Funcao: ponto de entrada para regras de agendamento.
|-- src/modules/appointment-history/appointment-history.module.ts
|   Funcao: modulo inicial de historico de agendamentos.
|-- src/modules/appointment-history/appointment-history.service.ts
|   Funcao: ponto de entrada para regras de historico.
|-- src/modules/waitlist/waitlist.module.ts
|   Funcao: modulo inicial de fila de espera.
`-- src/modules/waitlist/waitlist.service.ts
    Funcao: ponto de entrada para regras de waitlist.
```

## O que ainda precisa no ambiente local

- Node.js 20 ou superior.
- PostgreSQL rodando localmente.
- Banco criado e apontado em `DATABASE_URL`.
- Dependencias instaladas com `npm install`.

## O que ja vem pronto

- Prefixo global `api` com versao `v1` nas rotas.
- CORS habilitado para desenvolvimento local.
- `ValidationPipe` global.
- Tratamento global de erros.
- Resposta padrao `{ success, statusCode, data, timestamp }`.
- Autenticacao JWT com rotas `register`, `login` e `me`.
- Prisma configurado com PostgreSQL.
- Seed inicial para administrador local.
- Modulos por dominio para evolucao futura.
- Documento de alinhamento arquitetural em `docs/architecture-standards.md`.


