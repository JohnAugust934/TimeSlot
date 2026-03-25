# Entidades do Sistema

## 1. Objetivo

Este documento descreve as entidades principais do sistema de agendamento multiprofissional, seus papéis no domínio, campos mais importantes, relacionamentos e observações de modelagem.

Ele serve como referência para:

- modelagem de banco
- implementação do backend
- implementação do frontend
- consistência de nomenclatura
- evolução futura do sistema

---

## 2. Diretrizes de modelagem

### 2.1. Modelagem genérica

O sistema deve ser modelado com conceitos genéricos, evitando termos exclusivos da área médica.

Preferir:

- `professional`
- `client`
- `service`
- `appointment`

Evitar:

- `doctor`
- `patient_only`
- `medical_consultation_only`

Isso permite reutilização do sistema para:

- saúde
- estética
- barbearia
- serviços em geral baseados em agenda

### 2.2. Convenção de nomes

Sugestão:

- nome da tabela: plural
- nome da entidade no código: singular
- nomes de campos: inglês
- interface do sistema: português

Exemplo:

- tabela: `professionals`
- entidade: `Professional`

### 2.3. IDs

Todas as entidades principais devem utilizar identificadores únicos estáveis, preferencialmente:

- CUID
- CUID

### 2.4. Datas

Sugestão de campos de auditoria:

- `createdAt`
- `updatedAt`

Quando aplicável:

- `deletedAt`
- `cancelledAt`

Datas devem ser armazenadas de forma consistente, preferencialmente em UTC.

---

## 3. Entidades principais

### 3.1. User

**Papel no domínio:** representa uma conta autenticável no sistema.

**Exemplos de perfis:**

- administrador
- recepcionista
- profissional
- cliente

**Campos principais sugeridos:**

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `active`
- `createdAt`
- `updatedAt`

**Observações:**

- nem todo `client` precisa necessariamente ter acesso autenticado no MVP
- nem todo `professional` precisa inicialmente ser um `user`, mas a modelagem pode prever esse vínculo
- o sistema deve permitir expansão futura para ACL mais detalhada

**Relacionamentos:**

- um `user` pode criar muitos `appointments`
- um `user` pode registrar muitos `appointmentHistory`
- um `user` pode estar vinculado a um `professional`

### 3.2. Professional

**Papel no domínio:** representa o profissional que oferece atendimentos e possui agenda própria.

**Exemplos:**

- médico
- psicólogo
- nutricionista
- fisioterapeuta
- dentista
- esteticista
- barbeiro

**Campos principais sugeridos:**

- `id`
- `userId` opcional
- `fullName`
- `category`
- `specialty`
- `phone`
- `email`
- `active`
- `createdAt`
- `updatedAt`

**Observações:**

- `category` representa o tipo macro do profissional
- `specialty` representa a especialidade
- mesmo que inicialmente um profissional tenha apenas uma especialidade, a modelagem deve ser flexível para evolução

**Relacionamentos:**

- um `professional` possui muitas `availabilities`
- um `professional` possui muitos `agendaBlocks`
- um `professional` possui muitos `appointments`
- um `professional` pode oferecer muitos `services`
- um `professional` pode atuar em muitas `units`

### 3.3. Client

**Papel no domínio:** representa a pessoa que agenda e recebe o atendimento.

**Observação importante:** embora no contexto da saúde possa ser chamado de paciente, o sistema deve usar o conceito genérico `client`.

**Campos principais sugeridos:**

- `id`
- `fullName`
- `phone`
- `email`
- `document`
- `birthDate`
- `notes`
- `active`
- `createdAt`
- `updatedAt`

**Observações:**

- o cadastro rápido deve permitir criação com nome, telefone e e-mail
- campos adicionais podem ser preenchidos posteriormente
- a estrutura deve servir tanto para saúde quanto para outros segmentos

**Relacionamentos:**

- um `client` pode possuir muitos `appointments`
- um `client` pode possuir muitos registros em `waitlist`

### 3.4. Unit

**Papel no domínio:** representa o local ou unidade onde o profissional atende.

**Exemplos:**

- clínica A
- consultório B
- unidade centro
- estúdio
- barbearia filial 1

**Campos principais sugeridos:**

- `id`
- `name`
- `address`
- `city`
- `state`
- `active`
- `createdAt`
- `updatedAt`

**Observações:**

- mesmo que o MVP não explore multiunidade profundamente, a estrutura deve estar preparada
- um profissional pode atender em diferentes unidades em dias diferentes

**Relacionamentos:**

- uma `unit` pode possuir muitas `availabilities`
- uma `unit` pode possuir muitos `agendaBlocks`
- uma `unit` pode possuir muitos `appointments`

### 3.5. Service

**Papel no domínio:** representa o tipo de atendimento ou serviço que pode ser agendado.

**Exemplos:**

- consulta inicial
- retorno
- sessão
- avaliação
- encaixe
- corte de cabelo
- atendimento estético

**Campos principais sugeridos:**

- `id`
- `name`
- `description`
- `durationMinutes`
- `active`
- `createdAt`
- `updatedAt`

**Observações:**

- a duração do agendamento depende do serviço
- o sistema não deve usar uma duração fixa global
- o serviço ajuda a tornar a plataforma genérica

**Relacionamentos:**

- um `service` pode estar associado a muitos `appointments`
- um `service` pode ser oferecido por muitos `professionals`

### 3.6. ProfessionalService

**Papel no domínio:** entidade de associação entre profissional e serviço.

**Por que ela existe:** nem todo profissional oferece todo serviço.

**Campos principais sugeridos:**

- `id`
- `professionalId`
- `serviceId`
- `price` opcional
- `active`
- `createdAt`

**Observações:**

- mesmo que preço não faça parte do MVP, a entidade pode ser útil para expansão
- permite filtrar serviços disponíveis por profissional

**Relacionamentos:**

- muitos `professionals` para muitos `services`

### 3.7. Availability

**Papel no domínio:** representa a disponibilidade recorrente do profissional para atendimento.

**Exemplos:**

- segunda-feira, das 08:00 às 12:00
- quarta-feira, das 14:00 às 18:00

**Campos principais sugeridos:**

- `id`
- `professionalId`
- `unitId` opcional
- `weekday`
- `startTime`
- `endTime`
- `slotMinutes` opcional
- `active`
- `createdAt`
- `updatedAt`

**Observações:**

- `weekday` pode seguir convenção de 0 a 6 ou 1 a 7, mas deve ser padronizado
- `endTime` deve sempre ser maior que `startTime`
- não deve haver sobreposição inconsistente para o mesmo profissional no mesmo período
- a disponibilidade serve como base para cálculo dos horários livres

**Relacionamentos:**

- muitas `availabilities` pertencem a um `professional`
- muitas `availabilities` podem estar ligadas a uma `unit`

### 3.8. AgendaBlock

**Papel no domínio:** representa períodos bloqueados na agenda do profissional.

**Exemplos:**

- férias
- almoço
- reunião
- feriado
- indisponibilidade
- compromisso pessoal

**Campos principais sugeridos:**

- `id`
- `professionalId`
- `unitId` opcional
- `startsAt`
- `endsAt`
- `reason`
- `allDay`
- `createdAt`

**Observações:**

- todo bloqueio torna o período indisponível para novos agendamentos
- o sistema deve validar intervalos válidos
- bloqueios podem ser integrais ou parciais

**Relacionamentos:**

- muitos `agendaBlocks` pertencem a um `professional`
- muitos `agendaBlocks` podem estar ligados a uma `unit`

### 3.9. Appointment

**Papel no domínio:** é a entidade central do sistema. Representa o compromisso agendado entre cliente e profissional.

**Campos principais sugeridos:**

- `id`
- `professionalId`
- `clientId`
- `serviceId`
- `unitId` opcional
- `createdByUserId`
- `startsAt`
- `endsAt`
- `status`
- `confirmationStatus`
- `notes`
- `internalNotes`
- `createdAt`
- `updatedAt`
- `cancelledAt` opcional

**Regras principais:**

- deve estar vinculado a um profissional
- deve estar vinculado a um cliente
- deve estar vinculado a um serviço
- `endsAt` deve ser calculado com base na duração do serviço
- não pode conflitar com outro agendamento do mesmo profissional
- não pode ser criado em horário bloqueado

**Observações:**

- é a entidade mais importante da operação
- toda alteração relevante deve gerar histórico
- remarcação deve preservar rastreabilidade; preferencialmente cancelar o registro anterior, criar o novo e registrar o evento
- pode ser criada por admin, recepcionista, profissional e futuramente pelo próprio cliente

**Relacionamentos:**

- muitos `appointments` pertencem a um `professional`
- muitos `appointments` pertencem a um `client`
- muitos `appointments` pertencem a um `service`
- muitos `appointments` podem pertencer a uma `unit`
- muitos `appointments` são criados por um `user`
- um `appointment` possui muitos registros em `appointmentHistory`

### 3.10. AppointmentHistory

**Papel no domínio:** registra o histórico de alterações relevantes de um agendamento.

**Objetivo:** garantir rastreabilidade e auditoria.

**Exemplos de ações:**

- criado
- remarcado
- cancelado
- status alterado
- confirmação alterada

**Campos principais sugeridos:**

- `id`
- `appointmentId`
- `userId`
- `action`
- `description`
- `metadata`
- `createdAt`

**Observações:**

- `metadata` pode armazenar valores antigos e novos
- toda remarcação deve gerar histórico
- todo cancelamento deve gerar histórico
- alterações críticas devem ser registradas

**Relacionamentos:**

- muitos `appointmentHistory` pertencem a um `appointment`
- muitos `appointmentHistory` pertencem a um `user`

### 3.11. Waitlist

**Papel no domínio:** representa a fila de espera para encaixes ou vagas futuras.

**Exemplos de uso:**

- cliente quer ser avisado se surgir vaga
- cliente aceita horário livre em determinado período
- cliente deseja antecipar atendimento

**Campos principais sugeridos:**

- `id`
- `clientId`
- `professionalId`
- `serviceId`
- `preferredDate`
- `preferredPeriod`
- `notes`
- `status`
- `createdAt`

**Observações:**

- não é prioridade do MVP, mas faz sentido deixar modelado
- pode ser útil quando houver cancelamentos e encaixes

**Relacionamentos:**

- muitos registros de `waitlist` pertencem a um `client`
- muitos registros de `waitlist` pertencem a um `professional`
- muitos registros de `waitlist` pertencem a um `service`

---

## 4. Entidades complementares futuras

Estas entidades podem não entrar no MVP, mas o sistema deve poder evoluir para suportá-las.

### 4.1. Insurance / HealthPlan

Para uso em contextos de saúde.

**Possíveis campos:**

- `id`
- `name`
- `active`

### 4.2. ClientInsurance

Relação entre cliente e convênio ou plano.

**Possíveis campos:**

- `id`
- `clientId`
- `insuranceId`
- `cardNumber`
- `authorizationCode`
- `validUntil`

### 4.3. Notification

Para lembretes automáticos por e-mail, WhatsApp ou SMS.

**Possíveis campos:**

- `id`
- `appointmentId`
- `channel`
- `status`
- `sentAt`
- `errorMessage`

### 4.4. RolePermission

Caso o sistema evolua de papéis fixos para ACL detalhada.

**Possíveis campos:**

- `id`
- `role`
- `permissionKey`

---

## 5. Relacionamentos resumidos

- um `user` pode estar vinculado a um `professional`
- um `professional` possui sua própria agenda
- um `professional` possui muitas `availabilities`
- um `professional` possui muitos `agendaBlocks`
- um `professional` possui muitos `appointments`
- um `client` possui muitos `appointments`
- um `service` define a duração do atendimento
- um `appointment` conecta `professional`, `client` e `service`
- um `appointment` possui muitos registros em `appointmentHistory`
- um `professional` pode oferecer muitos `services`
- uma `unit` pode concentrar disponibilidades, bloqueios e agendamentos

---

## 6. Regras críticas associadas às entidades

### Regra 1

`Appointment` não pode conflitar com outro `Appointment` do mesmo `Professional`.

### Regra 2

`Appointment` não pode existir dentro de um intervalo de `AgendaBlock`.

### Regra 3

`Appointment.endsAt` deve ser calculado a partir de `Service.durationMinutes`.

### Regra 4

`Professional` possui agenda própria.

### Regra 5

`Client` pode ter vários agendamentos.

### Regra 6

Toda remarcação ou cancelamento deve gerar `AppointmentHistory`.

### Regra 7

`Availability` é a base para geração dos horários livres.

---

## 7. Status padronizados

### Status do agendamento

- `SCHEDULED`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`
- `RESCHEDULED`

### Status de confirmação

- `PENDING`
- `CONFIRMED`
- `DECLINED`

### Status da fila de espera

- `WAITING`
- `CALLED`
- `CONVERTED`
- `CANCELLED`

---

## 8. Observações finais

Este documento deve ser revisado sempre que:

- uma entidade nova for criada
- algum relacionamento mudar
- uma regra de negócio impactar a modelagem
- o sistema ganhar um novo módulo relevante

Se houver divergência entre:

- `regras-de-negocio.md`
- `fluxos.md`
- `entidades.md`
- schema do banco

a inconsistência deve ser corrigida antes de continuar o desenvolvimento.

