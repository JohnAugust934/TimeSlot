# Fluxos do Sistema

## 1. Objetivo

Este documento descreve os principais fluxos de uso do sistema de agendamento multiprofissional.

Os fluxos aqui descritos servem para orientar:

- implementação do backend
- implementação do frontend
- validação das regras de negócio
- testes
- documentação do produto

---

## 2. Perfis principais

Perfis iniciais previstos:

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`
- `CLIENT`

Na versão inicial, o uso principal será interno, mas o sistema deve ser preparado para autoagendamento do cliente em fases futuras.

---

## 3. Fluxo de login

**Objetivo:** permitir que o usuário autenticado acesse o sistema de acordo com seu perfil.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`
- `CLIENT`

**Pré-condições:**

- usuário cadastrado
- usuário ativo
- credenciais válidas

**Fluxo principal:**

1. Usuário acessa a tela de login.
2. Informa e-mail e senha.
3. Sistema valida as credenciais.
4. Sistema gera token de autenticação.
5. Sistema retorna os dados do usuário autenticado.
6. Usuário é redirecionado para a área autenticada.

**Pós-condições:**

- sessão autenticada ativa
- permissões aplicadas conforme perfil

**Exceções:**

- e-mail inválido
- senha incorreta
- usuário inativo
- token expirado

---

## 4. Fluxo de criar cliente

**Objetivo:** cadastrar um novo cliente no sistema.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`

**Pré-condições:**

- usuário autenticado
- usuário com permissão de cadastro

**Dados mínimos:**

- nome
- telefone
- e-mail

**Dados opcionais:**

- documento
- data de nascimento
- observações
- dados complementares futuros

**Fluxo principal:**

1. Usuário acessa o módulo de clientes.
2. Clica em "Novo cliente".
3. Preenche os dados mínimos obrigatórios.
4. Preenche dados complementares, se desejar.
5. Confirma o cadastro.
6. Sistema valida os dados.
7. Sistema cria o registro do cliente.
8. Sistema retorna sucesso.

**Pós-condições:**

- cliente cadastrado
- cliente disponível para futuros agendamentos

**Exceções:**

- nome ausente
- telefone inválido
- e-mail inválido
- duplicidade crítica, se houver regra futura

---

## 5. Fluxo de criar disponibilidade

**Objetivo:** definir os horários em que o profissional pode receber agendamentos.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`

**Pré-condições:**

- profissional cadastrado
- usuário autenticado com permissão

**Dados esperados:**

- profissional
- dia da semana
- horário inicial
- horário final
- unidade opcional
- duração ou slot opcional

**Fluxo principal:**

1. Usuário acessa o cadastro de disponibilidade do profissional.
2. Seleciona o profissional.
3. Informa dia da semana.
4. Informa hora de início e fim.
5. Informa unidade, se aplicável.
6. Salva a disponibilidade.
7. Sistema valida os horários.
8. Sistema impede sobreposição inconsistente.
9. Sistema registra a disponibilidade.

**Pós-condições:**

- disponibilidade ativa para cálculo da agenda

**Exceções:**

- horário final menor que inicial
- disponibilidade duplicada ou sobreposta
- profissional inexistente

---

## 6. Fluxo de criar bloqueio de agenda

**Objetivo:** registrar períodos em que o profissional não poderá receber agendamentos.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`

**Pré-condições:**

- profissional cadastrado
- usuário autenticado com permissão

**Exemplos de bloqueio:**

- férias
- almoço
- reunião
- indisponibilidade
- feriado
- compromisso pessoal

**Fluxo principal:**

1. Usuário acessa a agenda do profissional.
2. Seleciona a opção "Bloquear horário".
3. Informa data e hora inicial.
4. Informa data e hora final.
5. Informa motivo do bloqueio.
6. Define se é bloqueio integral ou parcial.
7. Salva o bloqueio.
8. Sistema valida o intervalo.
9. Sistema registra o bloqueio.

**Pós-condições:**

- período bloqueado deixa de aparecer como disponível

**Exceções:**

- intervalo inválido
- profissional inexistente
- permissão insuficiente

---

## 7. Fluxo de buscar horários disponíveis

**Objetivo:** retornar apenas horários válidos para um profissional em determinada data.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`
- `CLIENT` no futuro

**Pré-condições:**

- profissional cadastrado
- serviço cadastrado
- disponibilidade configurada

**Regras envolvidas:**

- usar disponibilidade do profissional
- considerar bloqueios de agenda
- considerar agendamentos já existentes
- usar duração do serviço
- exibir apenas horários livres

**Fluxo principal:**

1. Usuário escolhe profissional.
2. Usuário escolhe serviço.
3. Usuário escolhe data desejada.
4. Sistema busca a disponibilidade do profissional para aquela data.
5. Sistema aplica bloqueios de agenda.
6. Sistema aplica ocupações já existentes.
7. Sistema calcula os slots livres.
8. Sistema retorna apenas horários válidos.

**Pós-condições:**

- usuário visualiza somente horários disponíveis

**Exceções:**

- profissional sem disponibilidade
- serviço inexistente
- data inválida
- nenhum horário disponível

---

## 8. Fluxo de criar agendamento

**Objetivo:** criar um novo agendamento para um cliente com um profissional.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`
- `CLIENT` no futuro

**Pré-condições:**

- cliente cadastrado
- profissional cadastrado
- serviço cadastrado
- horário disponível
- usuário autenticado com permissão

**Dados obrigatórios:**

- cliente
- profissional
- serviço
- data e hora inicial

**Dados opcionais:**

- unidade
- observações
- observações internas

**Fluxo principal:**

1. Usuário acessa a tela de novo agendamento.
2. Seleciona ou busca o cliente.
3. Seleciona o profissional.
4. Seleciona o serviço.
5. Seleciona a data.
6. Sistema apresenta horários disponíveis.
7. Usuário escolhe um horário.
8. Sistema calcula o horário de término com base na duração do serviço.
9. Sistema valida conflito de horário.
10. Sistema valida bloqueios de agenda.
11. Sistema cria o agendamento.
12. Sistema registra histórico de criação.
13. Sistema retorna sucesso.

**Pós-condições:**

- agendamento criado
- horário passa a ficar indisponível
- histórico registrado

**Exceções:**

- conflito de horário
- horário bloqueado
- cliente inexistente
- profissional inexistente
- serviço inexistente
- usuário sem permissão

---

## 9. Fluxo de remarcar agendamento

**Objetivo:** alterar a data e ou horário de um agendamento existente, preservando o histórico.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`
- `CLIENT` com restrições futuras

**Pré-condições:**

- agendamento existente
- usuário autenticado com permissão
- novo horário disponível

**Fluxo principal:**

1. Usuário abre um agendamento existente.
2. Seleciona a opção "Remarcar".
3. Escolhe nova data e horário.
4. Sistema valida a disponibilidade do novo horário.
5. Sistema valida ausência de conflito.
6. Sistema executa a estratégia de remarcação definida.
7. Sistema registra histórico de remarcação.
8. Sistema atualiza status se necessário.
9. Sistema retorna sucesso.

**Pós-condições:**

- agendamento remarcado
- histórico preservado
- horário antigo liberado
- novo horário ocupado

**Observação técnica:** a estratégia preferencial é cancelar o agendamento anterior, criar o novo e registrar o evento de remarcação.

**Exceções:**

- novo horário indisponível
- conflito de agenda
- agendamento inexistente
- usuário sem permissão

---

## 10. Fluxo de cancelar agendamento

**Objetivo:** cancelar um agendamento existente sem perder rastreabilidade.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`
- `CLIENT`

**Pré-condições:**

- agendamento existente
- usuário autenticado com permissão

**Fluxo principal:**

1. Usuário acessa os detalhes do agendamento.
2. Seleciona a opção "Cancelar".
3. Informa motivo, se aplicável.
4. Sistema altera status para cancelado.
5. Sistema registra data e hora do cancelamento.
6. Sistema registra o usuário responsável.
7. Sistema registra histórico da ação.
8. Sistema libera o horário na agenda.
9. Sistema retorna sucesso.

**Pós-condições:**

- agendamento cancelado
- histórico preservado
- horário liberado

**Exceções:**

- agendamento inexistente
- cancelamento sem permissão
- agendamento já cancelado

---

## 11. Fluxo de confirmar presença

**Objetivo:** registrar se o cliente confirmou ou não a presença.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`

**Pré-condições:**

- agendamento existente
- usuário autenticado com permissão

**Fluxo principal:**

1. Usuário acessa um agendamento.
2. Seleciona a ação de confirmação.
3. Marca a presença como confirmada ou pendente.
4. Sistema salva a informação.
5. Sistema registra histórico da alteração.
6. Sistema retorna sucesso.

**Pós-condições:**

- status de confirmação atualizado

**Exceções:**

- agendamento inexistente
- usuário sem permissão

---

## 12. Fluxo de registrar comparecimento

**Objetivo:** registrar o desfecho operacional do atendimento.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`

**Possíveis resultados:**

- compareceu
- faltou
- cancelou em cima da hora
- realizado

**Pré-condições:**

- agendamento existente
- data do atendimento atingida ou encerrada

**Fluxo principal:**

1. Usuário acessa a agenda do dia.
2. Seleciona um agendamento.
3. Informa o resultado do atendimento.
4. Sistema atualiza o status.
5. Sistema registra histórico.
6. Sistema retorna sucesso.

**Pós-condições:**

- agendamento com status final adequado
- dashboard e relatórios refletem o novo status

**Exceções:**

- agendamento inexistente
- usuário sem permissão
- status inválido

---

## 13. Fluxo de visualizar agenda

**Objetivo:** permitir consulta da agenda por profissional e período.

**Atores:**

- `ADMIN`
- `RECEPTIONIST`
- `PROFESSIONAL`

**Pré-condições:**

- usuário autenticado
- profissional cadastrado

**Filtros possíveis:**

- profissional
- data
- período
- status
- unidade

**Fluxo principal:**

1. Usuário acessa a tela de agenda.
2. Seleciona o profissional.
3. Seleciona o período desejado.
4. Sistema carrega agendamentos e bloqueios.
5. Sistema exibe agenda diária ou semanal.
6. Usuário pode abrir detalhes ou criar novo agendamento.

**Pós-condições:**

- agenda visualizada com consistência

**Exceções:**

- profissional inexistente
- erro de permissão
- falha de carregamento de dados

---

## 14. Fluxo futuro de autoagendamento do cliente

**Objetivo:** permitir que o próprio cliente escolha horário e crie o agendamento.

**Atores:**

- `CLIENT`

**Pré-condições:**

- cliente autenticado
- profissional disponível para autoagendamento
- serviço disponível

**Fluxo principal:**

1. Cliente acessa a área autenticada.
2. Seleciona categoria, profissional ou serviço.
3. Escolhe data desejada.
4. Sistema exibe horários disponíveis.
5. Cliente escolhe horário.
6. Sistema valida disponibilidade em tempo real.
7. Sistema cria o agendamento.
8. Sistema registra histórico.

**Pós-condições:**

- agendamento criado pelo próprio cliente

**Exceções:**

- horário ficou indisponível durante o processo
- profissional indisponível
- cliente sem permissão para esse tipo de agendamento

---

## 15. Resumo dos fluxos principais

Fluxos prioritários do MVP:

1. login
2. criar cliente
3. criar disponibilidade
4. criar bloqueio de agenda
5. buscar horários disponíveis
6. criar agendamento
7. remarcar
8. cancelar
9. confirmar presença
10. registrar comparecimento
11. visualizar agenda

Esses fluxos devem orientar a implementação inicial do backend e frontend.
