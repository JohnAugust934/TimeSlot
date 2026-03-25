BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE usuario_tipo AS ENUM ('admin', 'atendente', 'profissional', 'cliente');
CREATE TYPE profissional_categoria AS ENUM ('medico', 'psicologo', 'fisioterapeuta', 'nutricionista', 'dentista', 'outro');
CREATE TYPE agendamento_status AS ENUM (
    'pendente',
    'confirmado',
    'em_atendimento',
    'concluido',
    'cancelado',
    'faltou'
);
CREATE TYPE historico_acao AS ENUM (
    'criado',
    'confirmado',
    'remarcado',
    'cancelado',
    'concluido',
    'faltou'
);

CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    tipo usuario_tipo NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE unidade (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    endereco TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profissional (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria profissional_categoria NOT NULL DEFAULT 'outro',
    especialidade VARCHAR(150),
    usuario_id BIGINT UNIQUE REFERENCES usuario(id) ON DELETE SET NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cliente (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30),
    email VARCHAR(255),
    cpf VARCHAR(14),
    data_nascimento DATE,
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cliente_cpf_unico UNIQUE (cpf)
);

CREATE TABLE servico (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL UNIQUE,
    duracao_minutos INTEGER NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT servico_duracao_positiva CHECK (duracao_minutos > 0)
);

CREATE TABLE disponibilidade (
    id BIGSERIAL PRIMARY KEY,
    profissional_id BIGINT NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    dia_semana SMALLINT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    unidade_id BIGINT REFERENCES unidade(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT disponibilidade_dia_semana_valido CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT disponibilidade_intervalo_valido CHECK (hora_inicio < hora_fim)
);

CREATE TABLE bloqueio_agenda (
    id BIGSERIAL PRIMARY KEY,
    profissional_id BIGINT NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    motivo TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bloqueio_intervalo_valido CHECK (data_inicio < data_fim)
);

CREATE TABLE agendamento (
    id BIGSERIAL PRIMARY KEY,
    profissional_id BIGINT NOT NULL REFERENCES profissional(id) ON DELETE RESTRICT,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE RESTRICT,
    servico_id BIGINT NOT NULL REFERENCES servico(id) ON DELETE RESTRICT,
    unidade_id BIGINT REFERENCES unidade(id) ON DELETE SET NULL,
    data_hora_inicio TIMESTAMPTZ NOT NULL,
    data_hora_fim TIMESTAMPTZ NOT NULL,
    status agendamento_status NOT NULL DEFAULT 'pendente',
    observacoes TEXT,
    criado_por BIGINT REFERENCES usuario(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT agendamento_intervalo_valido CHECK (data_hora_inicio < data_hora_fim)
);

CREATE TABLE historico_agendamento (
    id BIGSERIAL PRIMARY KEY,
    agendamento_id BIGINT NOT NULL REFERENCES agendamento(id) ON DELETE CASCADE,
    acao historico_acao NOT NULL,
    data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id BIGINT REFERENCES usuario(id) ON DELETE SET NULL,
    observacoes TEXT
);

CREATE TABLE lista_espera (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    profissional_id BIGINT REFERENCES profissional(id) ON DELETE SET NULL,
    servico_id BIGINT REFERENCES servico(id) ON DELETE SET NULL,
    preferencia_horario TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profissional_usuario_id ON profissional(usuario_id);
CREATE INDEX idx_cliente_email ON cliente(email);
CREATE INDEX idx_disponibilidade_profissional_dia ON disponibilidade(profissional_id, dia_semana);
CREATE INDEX idx_bloqueio_profissional_intervalo ON bloqueio_agenda(profissional_id, data_inicio, data_fim);
CREATE INDEX idx_agendamento_profissional_inicio ON agendamento(profissional_id, data_hora_inicio);
CREATE INDEX idx_agendamento_cliente_inicio ON agendamento(cliente_id, data_hora_inicio);
CREATE INDEX idx_agendamento_status ON agendamento(status);
CREATE INDEX idx_historico_agendamento_data ON historico_agendamento(agendamento_id, data DESC);
CREATE INDEX idx_lista_espera_profissional ON lista_espera(profissional_id);

ALTER TABLE agendamento
    ADD CONSTRAINT agendamento_sem_conflito
    EXCLUDE USING gist (
        profissional_id WITH =,
        tstzrange(data_hora_inicio, data_hora_fim, '[)') WITH &&
    )
    WHERE (status IN ('pendente', 'confirmado', 'em_atendimento'));

ALTER TABLE bloqueio_agenda
    ADD CONSTRAINT bloqueio_sem_sobreposicao
    EXCLUDE USING gist (
        profissional_id WITH =,
        tstzrange(data_inicio, data_fim, '[)') WITH &&
    );

CREATE OR REPLACE FUNCTION definir_data_hora_fim_por_servico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_duracao_minutos INTEGER;
BEGIN
    SELECT duracao_minutos
      INTO v_duracao_minutos
      FROM servico
     WHERE id = NEW.servico_id;

    IF v_duracao_minutos IS NULL THEN
        RAISE EXCEPTION 'Servico % nao encontrado para o agendamento.', NEW.servico_id;
    END IF;

    IF NEW.data_hora_fim IS NULL THEN
        NEW.data_hora_fim := NEW.data_hora_inicio + make_interval(mins => v_duracao_minutos);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validar_agendamento_contra_bloqueio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM bloqueio_agenda b
         WHERE b.profissional_id = NEW.profissional_id
           AND tstzrange(b.data_inicio, b.data_fim, '[)') &&
               tstzrange(NEW.data_hora_inicio, NEW.data_hora_fim, '[)')
    ) THEN
        RAISE EXCEPTION 'Existe bloqueio de agenda para o profissional % no periodo informado.', NEW.profissional_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_agendamento_definir_fim
BEFORE INSERT OR UPDATE OF servico_id, data_hora_inicio, data_hora_fim
ON agendamento
FOR EACH ROW
EXECUTE FUNCTION definir_data_hora_fim_por_servico();

CREATE TRIGGER tg_agendamento_validar_bloqueio
BEFORE INSERT OR UPDATE OF profissional_id, data_hora_inicio, data_hora_fim, status
ON agendamento
FOR EACH ROW
WHEN (NEW.status IN ('pendente', 'confirmado', 'em_atendimento'))
EXECUTE FUNCTION validar_agendamento_contra_bloqueio();

CREATE TRIGGER tg_usuario_atualizado_em
BEFORE UPDATE ON usuario
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_unidade_atualizado_em
BEFORE UPDATE ON unidade
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_profissional_atualizado_em
BEFORE UPDATE ON profissional
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_cliente_atualizado_em
BEFORE UPDATE ON cliente
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_servico_atualizado_em
BEFORE UPDATE ON servico
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_disponibilidade_atualizado_em
BEFORE UPDATE ON disponibilidade
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_bloqueio_agenda_atualizado_em
BEFORE UPDATE ON bloqueio_agenda
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_agendamento_atualizado_em
BEFORE UPDATE ON agendamento
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_lista_espera_atualizado_em
BEFORE UPDATE ON lista_espera
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

COMMIT;
