# Endpoints da API

## 1. Objetivo

Este documento centraliza a documentação dos endpoints da API do sistema de agendamento.

Ele deve ser atualizado conforme a API evoluir. Para cada endpoint, documentar:

- método HTTP
- rota
- descrição
- autenticação
- payload de entrada
- resposta de sucesso
- possíveis erros
- observações de regra de negócio

---

## 2. Padrões gerais

### Base URL

Exemplo:

`/api/v1`

### Autenticação

Endpoints protegidos devem receber:

`Authorization: Bearer <token>`

### Content-Type

`application/json`

### Formato padrão de sucesso

```json
{
  "success": true,
  "data": {}
}
```

### Formato padrão de erro

```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": []
}
```

---

## 3. Auth

### POST /auth/login

**Descrição:** autentica o usuário no sistema.

**Autenticação:** não

**Payload:**

```json
{
  "email": "usuario@dominio.com",
  "password": "123456"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "user": {
      "id": "uuid",
      "name": "João",
      "email": "usuario@dominio.com",
      "role": "ADMIN"
    }
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `401` credenciais inválidas
- `403` usuário inativo

**Observações:**

- a senha deve ser validada com hash
- o token JWT deve ser retornado no login

### GET /auth/me

**Descrição:** retorna dados do usuário autenticado.

**Autenticação:** sim

**Payload:** sem payload

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "João",
    "email": "usuario@dominio.com",
    "role": "ADMIN"
  }
}
```

**Possíveis erros:**

- `401` token ausente
- `401` token inválido
- `401` token expirado

---

## 4. Users

### GET /users

**Descrição:** lista usuários.

**Autenticação:** sim

**Query params sugeridos:**

- `page`
- `limit`
- `search`
- `role`
- `active`

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 10,
    "total": 0
  }
}
```

**Possíveis erros:**

- `401` não autenticado
- `403` sem permissão

---

## 5. Professionals

### POST /professionals

**Descrição:** cria um novo profissional.

**Autenticação:** sim

**Payload:**

```json
{
  "fullName": "Maria Souza",
  "category": "Psicóloga",
  "specialty": "Terapia Clínica",
  "phone": "11999999999",
  "email": "maria@dominio.com",
  "active": true
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Maria Souza",
    "category": "Psicóloga",
    "specialty": "Terapia Clínica",
    "phone": "11999999999",
    "email": "maria@dominio.com",
    "active": true
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `401` não autenticado
- `403` sem permissão
- `409` e-mail já cadastrado, se essa regra existir

### GET /professionals

**Descrição:** lista profissionais.

**Autenticação:** sim

**Query params sugeridos:**

- `page`
- `limit`
- `search`
- `category`
- `specialty`
- `active`

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 10,
    "total": 0
  }
}
```

**Possíveis erros:**

- `401` não autenticado
- `403` sem permissão

### GET /professionals/:id

**Descrição:** busca um profissional por ID.

**Autenticação:** sim

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Maria Souza",
    "category": "Psicóloga",
    "specialty": "Terapia Clínica"
  }
}
```

**Possíveis erros:**

- `401` não autenticado
- `403` sem permissão
- `404` profissional não encontrado

### PATCH /professionals/:id

**Descrição:** atualiza dados de um profissional.

**Autenticação:** sim

**Payload:**

```json
{
  "fullName": "Maria Souza",
  "phone": "11988888888"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Maria Souza",
    "phone": "11988888888"
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `401` não autenticado
- `403` sem permissão
- `404` profissional não encontrado

### DELETE /professionals/:id

**Descrição:** desativa um profissional.

**Autenticação:** sim

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "active": false
  }
}
```

**Possíveis erros:**

- `401` não autenticado
- `403` sem permissão
- `404` profissional não encontrado

**Observações:**

- preferir soft delete em vez de remoção física

---

## 6. Clients

### POST /clients

**Descrição:** cria um cliente.

**Autenticação:** sim

**Payload:**

```json
{
  "fullName": "Carlos Silva",
  "phone": "11977777777",
  "email": "carlos@email.com",
  "document": "12345678900",
  "birthDate": "1990-05-10",
  "notes": "Cliente novo"
}
```

**Payload mínimo permitido:**

```json
{
  "fullName": "Carlos Silva",
  "phone": "11977777777",
  "email": "carlos@email.com"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Carlos Silva",
    "phone": "11977777777",
    "email": "carlos@email.com"
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `401` não autenticado
- `403` sem permissão

### GET /clients

**Descrição:** lista clientes.

**Autenticação:** sim

**Query params sugeridos:**

- `page`
- `limit`
- `search`
- `phone`
- `email`
- `active`

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 10,
    "total": 0
  }
}
```

### GET /clients/:id

**Descrição:** busca cliente por ID.

**Autenticação:** sim

**Possíveis erros:**

- `404` cliente não encontrado

### PATCH /clients/:id

**Descrição:** atualiza cliente.

**Autenticação:** sim

### DELETE /clients/:id

**Descrição:** desativa cliente.

**Autenticação:** sim

**Observações:**

- preferir soft delete

---

## 7. Services

### POST /services

**Descrição:** cria um serviço.

**Autenticação:** sim

**Payload:**

```json
{
  "name": "Consulta Inicial",
  "description": "Primeira consulta",
  "durationMinutes": 60,
  "active": true
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Consulta Inicial",
    "durationMinutes": 60,
    "active": true
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `401` não autenticado
- `403` sem permissão

### GET /services

**Descrição:** lista serviços.

**Autenticação:** sim

### GET /services/:id

**Descrição:** busca serviço por ID.

**Autenticação:** sim

### PATCH /services/:id

**Descrição:** atualiza serviço.

**Autenticação:** sim

### DELETE /services/:id

**Descrição:** desativa serviço.

**Autenticação:** sim

---

## 8. Availabilities

### POST /availabilities

**Descrição:** cria disponibilidade semanal do profissional.

**Autenticação:** sim

**Payload:**

```json
{
  "professionalId": "uuid",
  "weekday": 1,
  "startTime": "08:00",
  "endTime": "12:00",
  "unitId": "uuid-opcional",
  "slotMinutes": 30
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "professionalId": "uuid",
    "weekday": 1,
    "startTime": "08:00",
    "endTime": "12:00"
  }
}
```

**Possíveis erros:**

- `400` horário inválido
- `400` intervalo inválido
- `409` sobreposição de disponibilidade
- `404` profissional não encontrado

### GET /availabilities

**Descrição:** lista disponibilidades.

**Autenticação:** sim

**Query params sugeridos:**

- `professionalId`
- `weekday`
- `unitId`

### PATCH /availabilities/:id

**Descrição:** atualiza disponibilidade.

**Autenticação:** sim

### DELETE /availabilities/:id

**Descrição:** remove disponibilidade.

**Autenticação:** sim

---

## 9. Agenda Blocks

### POST /agenda-blocks

**Descrição:** cria bloqueio de agenda.

**Autenticação:** sim

**Payload:**

```json
{
  "professionalId": "uuid",
  "unitId": "uuid-opcional",
  "startsAt": "2026-03-30T12:00:00.000Z",
  "endsAt": "2026-03-30T13:00:00.000Z",
  "reason": "Almoço",
  "allDay": false
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "professionalId": "uuid",
    "startsAt": "2026-03-30T12:00:00.000Z",
    "endsAt": "2026-03-30T13:00:00.000Z",
    "reason": "Almoço"
  }
}
```

**Possíveis erros:**

- `400` intervalo inválido
- `401` não autenticado
- `403` sem permissão
- `404` profissional não encontrado

### GET /agenda-blocks

**Descrição:** lista bloqueios de agenda.

**Autenticação:** sim

**Query params sugeridos:**

- `professionalId`
- `dateFrom`
- `dateTo`
- `unitId`

### DELETE /agenda-blocks/:id

**Descrição:** remove bloqueio.

**Autenticação:** sim

---

## 10. Disponibilidade de horários

### GET /appointments/available-slots

**Descrição:** retorna horários livres para agendamento.

**Autenticação:** sim

**Query params obrigatórios:**

- `professionalId`
- `serviceId`
- `date`

**Exemplo:**

`/appointments/available-slots?professionalId=uuid&serviceId=uuid&date=2026-03-30`

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "date": "2026-03-30",
    "professionalId": "uuid",
    "serviceId": "uuid",
    "slots": [
      "08:00",
      "09:00",
      "10:30"
    ]
  }
}
```

**Possíveis erros:**

- `400` parâmetros ausentes
- `404` profissional não encontrado
- `404` serviço não encontrado
- `422` data inválida

**Observações:**

- deve considerar disponibilidade
- deve considerar bloqueios
- deve considerar agendamentos existentes
- deve respeitar a duração do serviço

---

## 11. Appointments

### POST /appointments

**Descrição:** cria um novo agendamento.

**Autenticação:** sim

**Payload:**

```json
{
  "professionalId": "uuid",
  "clientId": "uuid",
  "serviceId": "uuid",
  "unitId": "uuid-opcional",
  "startsAt": "2026-03-30T10:00:00.000Z",
  "notes": "Primeira consulta",
  "internalNotes": "Cliente veio por indicação"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "professionalId": "uuid",
    "clientId": "uuid",
    "serviceId": "uuid",
    "startsAt": "2026-03-30T10:00:00.000Z",
    "endsAt": "2026-03-30T11:00:00.000Z",
    "status": "SCHEDULED"
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `400` horário inválido
- `401` não autenticado
- `403` sem permissão
- `404` cliente, profissional ou serviço não encontrado
- `409` conflito de horário
- `409` horário bloqueado

**Observações:**

- `endsAt` deve ser calculado pela duração do serviço
- a criação deve registrar histórico

### GET /appointments

**Descrição:** lista agendamentos.

**Autenticação:** sim

**Query params sugeridos:**

- `page`
- `limit`
- `professionalId`
- `clientId`
- `serviceId`
- `status`
- `dateFrom`
- `dateTo`
- `unitId`

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 10,
    "total": 0
  }
}
```

### GET /appointments/:id

**Descrição:** retorna detalhes de um agendamento.

**Autenticação:** sim

**Possíveis erros:**

- `404` agendamento não encontrado

### PATCH /appointments/:id

**Descrição:** atualiza dados editáveis do agendamento.

**Autenticação:** sim

**Observações:**

- alterações relevantes devem gerar histórico

### PATCH /appointments/:id/reschedule

**Descrição:** remarca um agendamento.

**Autenticação:** sim

**Payload:**

```json
{
  "startsAt": "2026-04-02T14:00:00.000Z",
  "reason": "Solicitação do cliente"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startsAt": "2026-04-02T14:00:00.000Z",
    "endsAt": "2026-04-02T15:00:00.000Z",
    "status": "RESCHEDULED"
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `404` agendamento não encontrado
- `409` novo horário indisponível
- `409` conflito de horário

**Observações:**

- a remarcação deve preservar o histórico
- a estratégia preferencial é cancelar o agendamento anterior, criar o novo e registrar o evento

### PATCH /appointments/:id/cancel

**Descrição:** cancela um agendamento.

**Autenticação:** sim

**Payload:**

```json
{
  "reason": "Cliente desistiu"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelledAt": "2026-03-25T18:00:00.000Z"
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `403` sem permissão
- `404` agendamento não encontrado

**Observações:**

- o cancelamento deve gerar histórico

### PATCH /appointments/:id/status

**Descrição:** altera status do agendamento.

**Autenticação:** sim

**Payload:**

```json
{
  "status": "COMPLETED"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED"
  }
}
```

**Possíveis erros:**

- `400` status inválido
- `404` agendamento não encontrado

### PATCH /appointments/:id/confirmation

**Descrição:** atualiza status de confirmação.

**Autenticação:** sim

**Payload:**

```json
{
  "confirmationStatus": "CONFIRMED"
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "confirmationStatus": "CONFIRMED"
  }
}
```

**Possíveis erros:**

- `400` payload inválido
- `404` agendamento não encontrado

---

## 12. Appointment History

### GET /appointments/:id/history

**Descrição:** lista histórico de alterações do agendamento.

**Autenticação:** sim

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "CREATED",
      "description": "Agendamento criado",
      "createdAt": "2026-03-25T17:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "Admin"
      }
    }
  ]
}
```

**Possíveis erros:**

- `401` não autenticado
- `403` sem permissão
- `404` agendamento não encontrado

---

## 13. Dashboard

### GET /dashboard/summary

**Descrição:** retorna resumo da operação.

**Autenticação:** sim

**Query params sugeridos:**

- `date`
- `dateFrom`
- `dateTo`
- `professionalId`

**Resposta de sucesso:**

```json
{
  "success": true,
  "data": {
    "appointmentsToday": 12,
    "upcomingAppointments": 5,
    "noShows": 2,
    "cancelled": 1,
    "newClients": 3
  }
}
```

**Possíveis erros:**

- `401` não autenticado
- `403` sem permissão

---

## 14. Waitlist

### POST /waitlist

**Descrição:** adiciona cliente na lista de espera.

**Autenticação:** sim

**Payload:**

```json
{
  "clientId": "uuid",
  "professionalId": "uuid",
  "serviceId": "uuid",
  "preferredDate": "2026-04-10",
  "preferredPeriod": "MORNING",
  "notes": "Pode chamar se vagar cedo"
}
```

### GET /waitlist

**Descrição:** lista entradas da fila de espera.

**Autenticação:** sim

---

## 15. Convenções de status

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

---

## 16. Convenções de erro

### 400 Bad Request

Payload inválido, dados ausentes ou regra simples violada.

### 401 Unauthorized

Usuário não autenticado ou token inválido.

### 403 Forbidden

Usuário autenticado, mas sem permissão.

### 404 Not Found

Recurso não encontrado.

### 409 Conflict

Conflito de agenda, bloqueio ou duplicidade relevante.

### 422 Unprocessable Entity

Formato aceito, mas semanticamente inválido, como datas incorretas.

---

## 17. Observações finais

Este documento deve ser atualizado sempre que:

- um novo endpoint for criado
- um payload mudar
- uma regra de negócio impactar a API
- um erro novo precisar ser padronizado

Idealmente, a documentação deste arquivo deve acompanhar a documentação automática da API, como Swagger/OpenAPI, quando estiver disponível.
