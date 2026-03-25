# Regras de Negócio

## 1. Visão geral

Este sistema é uma plataforma de agendamento multiprofissional, com foco inicial em profissionais da saúde, mas preparada para outros segmentos que trabalham com horários agendados, como estética, barbearia e outros serviços.

O sistema deve ser modelado com conceitos genéricos, evitando termos excessivamente específicos de um único nicho.

Conceitos principais:

- profissional
- cliente
- serviço
- agendamento
- disponibilidade
- bloqueio de agenda

---

## 2. Regras gerais do domínio

### RN001 - O sistema deve ser genérico

O sistema não deve ser modelado exclusivamente para médicos ou clínicas médicas.

Deve utilizar conceitos genéricos como:

- `professional`
- `client`
- `service`
- `appointment`

Isso permite expansão futura para outros profissionais além da área da saúde.

### RN002 - Cada profissional possui agenda própria

Cada profissional deve possuir sua própria agenda, disponibilidade e bloqueios.

Não haverá agenda compartilhada entre profissionais na versão inicial.

### RN003 - Cliente pode ter múltiplos agendamentos

Um cliente pode possuir:

- vários agendamentos com o mesmo profissional
- vários agendamentos com profissionais diferentes
- histórico de agendamentos passados e futuros

### RN004 - O agendamento está vinculado a um profissional

Todo agendamento deve estar vinculado obrigatoriamente a um profissional.

Em alguns fluxos, o cliente pode escolher primeiro a especialidade ou categoria, mas o agendamento final sempre deve estar associado a um profissional específico.

### RN005 - O agendamento está vinculado a um serviço

Todo agendamento deve estar vinculado a um serviço ou tipo de atendimento.

Exemplos:

- consulta inicial
- retorno
- avaliação
- sessão
- encaixe

---

## 3. Regras de disponibilidade e agenda

### RN006 - O profissional define sua disponibilidade

A disponibilidade do profissional pode ser configurada por:

- agenda semanal fixa
- horários variáveis
- configuração manual

A modelagem deve permitir flexibilidade suficiente para suportar esses cenários.

### RN007 - Bloqueio de agenda torna o horário indisponível

Sempre que existir um bloqueio de agenda, o período bloqueado deve ser considerado indisponível para novos agendamentos.

Exemplos de bloqueio:

- férias
- almoço
- reunião
- indisponibilidade
- feriado
- compromissos pessoais

### RN008 - Não permitir conflito de horário

O sistema não deve permitir dois agendamentos conflitantes para o mesmo profissional no mesmo intervalo de tempo.

A validação deve considerar:

- horário de início
- horário de término
- agendamentos existentes
- bloqueios de agenda

Apenas horários realmente livres podem ser exibidos como disponíveis.

### RN009 - O sistema deve exibir somente horários livres

Ao consultar a agenda disponível de um profissional, o sistema deve exibir apenas horários livres.

Horários ocupados, bloqueados ou inválidos não devem ser exibidos como opção de agendamento.

### RN010 - Duração do atendimento depende do serviço

A duração do agendamento não é fixa globalmente.

Ela deve ser determinada pelo serviço associado ao agendamento.

Exemplos:

- consulta: 30 minutos
- sessão: 50 minutos
- avaliação: 60 minutos

O campo `endsAt` deve ser calculado a partir de:

- `startsAt`
- `durationMinutes` do serviço

### RN011 - Intervalo entre atendimentos pode existir

O profissional pode definir se deseja ou não intervalo entre atendimentos.

A arquitetura deve permitir evolução futura para suportar regras mais específicas de intervalo.

### RN012 - Encaixe manual é permitido apenas para perfis autorizados

O encaixe manual, quando existir, só pode ser realizado por:

- administrador
- atendente ou recepcionista
- o próprio profissional

Clientes não podem criar encaixe manual por conta própria.

---

## 4. Regras de cadastro

### RN013 - Cadastro rápido de cliente é permitido

O sistema deve permitir cadastro rápido de cliente com os dados mínimos:

- nome
- telefone
- e-mail

Campos adicionais podem ser preenchidos posteriormente.

### RN014 - O cadastro de cliente deve servir para diferentes contextos

O cadastro deve ser flexível para atender tanto:

- pacientes da saúde
- clientes de outros segmentos

Campos como convênio e dados específicos da saúde devem ser opcionais ou modelados de forma extensível.

### RN015 - O profissional pode ter categoria e especialidade

O sistema deve permitir que o profissional tenha:

- categoria
- especialidade

Mesmo que inicialmente um profissional atue em apenas uma especialidade, a modelagem deve permitir evolução futura.

### RN016 - O profissional pode atuar em mais de um local ou unidade

A estrutura do sistema deve permitir que um profissional atenda em:

- um ou mais locais
- uma ou mais unidades
- dias diferentes em unidades diferentes

---

## 5. Regras de agendamento

### RN017 - O agendamento pode ser criado por diferentes perfis

Na versão atual, o agendamento pode ser criado por:

- administrador
- atendente
- profissional
- cliente, quando o fluxo de autoagendamento existir

Na fase inicial, o sistema pode operar apenas com uso interno.

### RN018 - O agendamento pode ser editado por perfis autorizados

A edição de detalhes do agendamento deve ser permitida para:

- atendente
- administrador
- profissional

O cliente poderá ter permissões restritas em fluxos futuros.

### RN019 - O agendamento pode ser cancelado por perfis autorizados

O cancelamento pode ser realizado por:

- atendente
- administrador
- profissional
- cliente

Toda ação de cancelamento deve ser registrada em histórico.

### RN020 - A remarcação deve manter histórico

Toda remarcação deve gerar registro de histórico para auditoria.

O sistema não deve simplesmente sobrescrever os dados sem rastreabilidade.

O histórico deve registrar pelo menos:

- data e hora da ação
- usuário responsável
- tipo da ação
- valores antigos e novos, quando aplicável

Como estratégia preferencial, a remarcação deve cancelar o agendamento anterior, criar o novo e registrar o evento de remarcação.

### RN021 - Cancelamento deve gerar histórico

Todo cancelamento deve gerar histórico com:

- data e hora
- usuário responsável
- motivo, quando informado

### RN022 - O sistema deve controlar status do agendamento

Os agendamentos devem possuir status padronizados.

Sugestão inicial:

- `SCHEDULED`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`
- `RESCHEDULED`

Esses status devem ser controlados de forma consistente em toda a aplicação.

### RN023 - O sistema deve permitir confirmação de presença

O sistema deve permitir registrar se o cliente:

- confirmou presença
- compareceu
- faltou
- cancelou próximo do horário

---

## 6. Regras de comunicação

### RN024 - O sistema poderá enviar lembretes automáticos

Na versão inicial, a comunicação automática pode ser feita por e-mail.

Integração com WhatsApp pode ser adicionada futuramente.

### RN025 - A confirmação do cliente pode ser registrada

O sistema deve permitir registrar se o cliente confirmou o agendamento.

Essa confirmação pode ser:

- manualmente registrada por atendente ou profissional
- futuramente automatizada

---

## 7. Regras de acesso e segurança

### RN026 - O sistema possui controle de acesso por perfil

Perfis iniciais:

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`
- `CLIENT`

Deve existir possibilidade de expansão futura para ACL mais detalhada.

### RN027 - Usuário autenticado deve ver apenas o que lhe é permitido

Exemplos:

- administrador vê tudo
- atendente gerencia a agenda operacional
- profissional vê sua própria agenda
- cliente vê seus próprios agendamentos

### RN028 - Ações importantes devem ser auditáveis

Ações críticas devem ser registradas em histórico ou log:

- criação de agendamento
- remarcação
- cancelamento
- alteração de status
- confirmação de presença

---

## 8. Regras fora de escopo inicial

### RN029 - Financeiro não faz parte da versão inicial

O sistema não irá controlar inicialmente:

- pagamentos
- repasses
- recibos
- faturamento
- contas a receber

### RN030 - Convênios são opcionais e apenas para extensão futura

Pode existir modelagem para suportar convênio em contextos de saúde, mas isso não é prioridade do MVP.

---

## 9. Regras de arquitetura e implementação

### RN031 - O código deve usar nomenclatura genérica

Evitar nomes como:

- `doctor`
- `medicalAppointment`
- `patientOnly`

Preferir:

- `professional`
- `client`
- `service`
- `appointment`

### RN032 - Datas devem ser tratadas com consistência

O backend deve armazenar datas e horários em padrão consistente, preferencialmente UTC.

O frontend deve tratar timezone para exibição correta ao usuário.

### RN033 - Concorrência deve ser considerada

O sistema deve ser preparado para múltiplos acessos simultâneos.

A criação de agendamento deve considerar proteção contra conflitos gerados por concorrência.

---

## 10. Resumo das regras críticas

Estas são as regras mais importantes do sistema:

1. Não permitir conflito de horário.
2. Profissional tem agenda própria.
3. Remarcação deve gerar histórico.
4. Bloqueio de agenda torna horário indisponível.
5. Duração depende do serviço.
6. Cliente pode ter vários agendamentos.
7. Encaixe só por atendente, admin ou profissional.
8. Agendamento sempre vinculado a profissional e serviço.
9. Apenas horários livres podem ser exibidos.
10. Ações críticas devem ser auditáveis.
