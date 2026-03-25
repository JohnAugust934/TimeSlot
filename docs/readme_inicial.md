# Scheduler System

Sistema web responsivo de agendamento multiprofissional, com foco inicial em profissionais da saúde, mas preparado para outros segmentos como estética, barbearia e serviços em geral baseados em horário.

## 1. Visão geral

O objetivo deste projeto é centralizar agendamentos, reduzir conflitos de horário, manter histórico de alterações e permitir expansão futura para múltiplos profissionais, múltiplas unidades e múltiplos tipos de serviço.

O sistema deve ser modelado de forma genérica, evitando termos específicos de um único nicho, para que possa ser reutilizado em diferentes cenários de negócio.

### Conceitos principais

- `Professional`
- `Client`
- `Service`
- `Appointment`
- `Availability`
- `AgendaBlock`

---

## 2. Stack do projeto

### Backend

- Node.js
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication
- `class-validator`
- `class-transformer`

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Fetch API ou Axios

### Ambiente de desenvolvimento

- Docker
- Docker Compose
- PostgreSQL ou Supabase
- Adminer ou pgAdmin
- VS Code

---

## 3. Estrutura do projeto

Estrutura sugerida em monorepo:

```txt
scheduler-system/
|
+-- apps/
|   +-- api/
|   |   +-- prisma/
|   |   |   +-- schema.prisma
|   |   |   +-- migrations/
|   |   |   +-- seed.ts
|   |   |
|   |   +-- src/
|   |   |   +-- common/
|   |   |   +-- config/
|   |   |   +-- database/
|   |   |   +-- modules/
|   |   |   |   +-- auth/
|   |   |   |   +-- users/
|   |   |   |   +-- professionals/
|   |   |   |   +-- clients/
|   |   |   |   +-- units/
|   |   |   |   +-- services/
|   |   |   |   +-- availabilities/
|   |   |   |   +-- agenda-blocks/
|   |   |   |   +-- appointments/
|   |   |   |   +-- appointment-history/
|   |   |   |   +-- waitlist/
|   |   |   |   +-- dashboard/
|   |   |   |
|   |   |   +-- app.module.ts
|   |   |   +-- main.ts
|   |   |
|   |   +-- test/
|   |   +-- .env
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |
|   +-- web/
|       +-- public/
|       +-- src/
|       |   +-- app/
|       |   +-- components/
|       |   +-- lib/
|       |   +-- hooks/
|       |   +-- types/
|       |   +-- middleware.ts
|       |
|       +-- .env.local
|       +-- package.json
|       +-- tsconfig.json
|
+-- docs/
|   +-- regras-de-negocio.md
|   +-- fluxos.md
|   +-- entidades.md
|   +-- endpoints.md
|
+-- docker/
+-- docker-compose.yml
+-- package.json
+-- README.md
```

---

## 4. Documentação do domínio

Antes de gerar ou alterar código, consulte os documentos em `docs/`:

- `docs/regras-de-negocio.md`
- `docs/fluxos.md`
- `docs/entidades.md`
- `docs/endpoints.md`

Esses arquivos são a referência principal para o desenvolvimento e devem ser atualizados sempre que houver mudança de regra, fluxo ou modelagem.

---

## 5. Convenções do projeto

### 5.1. Convenções de modelagem

O sistema deve usar conceitos genéricos e evitar termos específicos da área médica.

Preferir:

- `professional`
- `client`
- `service`
- `appointment`

Evitar:

- `doctor`
- `patient_only`
- `medical_consultation`

### 5.2. Idioma

- código: inglês
- interface: português
- documentação técnica: português
- nomes de tabelas e campos: inglês

### 5.3. Convenções de nomenclatura

- tabelas: plural
- entidades e classes: singular
- nomes de arquivos: `kebab-case`, quando fizer sentido
- DTOs e classes: `PascalCase`
- variáveis e funções: `camelCase`
- enums: `UPPER_SNAKE_CASE` para valores

Exemplo:

- tabela: `appointments`
- entidade: `Appointment`
- enum de status: `SCHEDULED`

### 5.4. Convenções de status

**AppointmentStatus**

- `SCHEDULED`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`
- `RESCHEDULED`

**ConfirmationStatus**

- `PENDING`
- `CONFIRMED`
- `DECLINED`

**UserRole**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`
- `CLIENT`

### 5.5. Datas e horário

- o backend deve armazenar datas em UTC
- o frontend deve tratar timezone para exibição correta
- horários de agenda devem ser manipulados com consistência
- o cálculo de `endsAt` sempre depende da duração do serviço

### 5.6. Regras críticas de desenvolvimento

Estas regras nunca devem ser quebradas:

- não permitir conflito de horário
- cada profissional possui agenda própria
- bloqueio de agenda torna horário indisponível
- remarcação deve gerar histórico
- cancelamento deve gerar histórico
- a duração do atendimento depende do serviço
- cliente pode ter vários agendamentos
- encaixe manual só por perfil autorizado
- apenas horários livres devem ser exibidos
- ações críticas devem ser auditáveis

---

## 6. Pré-requisitos

Instale localmente:

- Node.js LTS
- npm ou pnpm
- Docker
- Docker Compose
- Git

Opcional, mas recomendado:

- VS Code
- extensão Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense

---

## 7. Variáveis de ambiente

### 7.1. Backend (`apps/api/.env`)

Exemplo:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scheduler
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
```

### 7.2. Frontend (`apps/web/.env.local`)

Exemplo:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Observações:**

- nunca versionar `.env`
- sempre manter `.env.example` atualizado
- qualquer nova variável deve ser documentada

---

## 8. Comandos principais

Os comandos abaixo podem variar conforme a estrutura final do monorepo, mas esta é a referência esperada.

### 8.1. Subir banco local com Docker

```bash
docker compose up -d
```

### 8.2. Derrubar containers

```bash
docker compose down
```

### 8.3. Instalar dependências no projeto

Na raiz:

```bash
npm install
```

### 8.4. Rodar backend em modo desenvolvimento

```bash
npm run dev --workspace=apps/api
```

### 8.5. Rodar frontend em modo desenvolvimento

```bash
npm run dev --workspace=apps/web
```

### 8.6. Prisma

Gerar client:

```bash
npx prisma generate --schema apps/api/prisma/schema.prisma
```

Criar migration:

```bash
npx prisma migrate dev --schema apps/api/prisma/schema.prisma
```

Abrir Prisma Studio:

```bash
npx prisma studio --schema apps/api/prisma/schema.prisma
```

Rodar seed:

```bash
npx ts-node apps/api/prisma/seed.ts
```

### 8.7. Build

Backend:

```bash
npm run build --workspace=apps/api
```

Frontend:

```bash
npm run build --workspace=apps/web
```

### 8.8. Lint

Backend:

```bash
npm run lint --workspace=apps/api
```

Frontend:

```bash
npm run lint --workspace=apps/web
```

### 8.9. Testes

Backend:

```bash
npm run test --workspace=apps/api
```

Se houver testes `e2e`:

```bash
npm run test:e2e --workspace=apps/api
```

---

## 9. Ordem recomendada de desenvolvimento

O desenvolvimento deve seguir o núcleo do negócio, não apenas a interface.

### Fase 1 - Fundação

- configurar ambiente local
- subir PostgreSQL
- configurar backend NestJS
- configurar Prisma
- autenticação e autorização
- módulo de usuários

### Fase 2 - Cadastros principais

- profissionais
- clientes
- serviços
- unidades

### Fase 3 - Regras de agenda

- disponibilidades
- bloqueios de agenda
- cálculo de horários livres
- criação de agendamento
- remarcação
- cancelamento
- histórico de agendamento

### Fase 4 - Operação

- dashboard inicial
- filtros de agenda
- confirmação de presença
- registro de comparecimento

### Fase 5 - Evoluções

- lista de espera
- notificação por e-mail
- portal do cliente
- múltiplas unidades avançadas
- ACL avançada
- integrações futuras, como WhatsApp

---

## 10. Roadmap de desenvolvimento

### MVP

**Objetivo do MVP:**

- permitir agendamento básico
- permitir uso interno
- garantir controle de agenda
- garantir histórico mínimo
- evitar conflitos

**Itens do MVP:**

- login
- perfis básicos
- cadastro de profissional
- cadastro de cliente
- cadastro de serviço
- disponibilidade do profissional
- bloqueio de agenda
- busca de horários disponíveis
- criação de agendamento
- cancelamento
- remarcação com histórico
- dashboard simples

### Pós-MVP

- multiusuários mais avançado
- cliente agendando sozinho
- confirmação por e-mail
- fila de espera
- dashboard mais completo
- melhorias responsivas mobile
- configurações por profissional
- multiunidade refinada

### Futuro

- integração com WhatsApp
- convênios
- relatórios avançados
- notificações automáticas
- ACL detalhada
- white-label ou SaaS multi-tenant

---

## 11. Boas práticas para desenvolvimento com Codex

Antes de pedir qualquer código ao Codex:

- consultar `docs/regras-de-negocio.md`
- consultar `docs/fluxos.md`
- consultar `docs/entidades.md`
- validar se a solicitação respeita o domínio
- pedir implementações por módulo, não o sistema inteiro

Sempre informar ao Codex:

- stack usada
- módulo a ser implementado
- regras de negócio relacionadas
- estrutura de pastas esperada
- padrão de resposta esperado
- necessidade de código limpo, modular e tipado

Evitar prompts vagos como:

- "crie o sistema todo"
- "faça tudo da agenda"
- "monte tudo automaticamente"

Preferir prompts como:

- "implemente o módulo de appointments em NestJS com Prisma"
- "crie a lógica de available slots considerando bloqueios e conflitos"
- "gere controller, service, DTOs e validações do módulo de clients"

---

## 12. Checklist de qualidade antes de subir código

Antes de considerar uma entrega pronta, verificar:

- regras de negócio respeitadas
- sem conflito de horário
- histórico criado quando necessário
- validações de payload implementadas
- tratamento de erro padronizado
- tipagem consistente
- nomes coerentes com o domínio
- documentação atualizada
- endpoint documentado
- lint sem erros

---

## 13. Observações finais

Este projeto deve evoluir com base em:

- regras de negócio claras
- modelagem consistente
- implementação modular
- documentação viva

Se houver divergência entre código e documentação, a documentação deve ser revisada e o impacto no código deve ser avaliado antes de seguir com novas implementações.
