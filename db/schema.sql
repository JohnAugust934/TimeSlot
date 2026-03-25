BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE usuario_tipo AS ENUM ('admin', 'atendente', 'profissional', 'cliente');

CREATE TYPE agendamento_status AS ENUM (
    'agendado',
    'confirmado',
    'em_atendimento',
    'concluido',
    'cancelado',
    'faltou',
    'remarcado'
);

CREATE TYPE confirmacao_status AS ENUM (
    'pendente',
    'confirmado',
    'recusado'
);

CREATE TYPE historico_acao AS ENUM (
    'criado',
    'confirmado',
    'confirmacao_alterada',
    'remarcado',
    'cancelado',
    'concluido',
    'faltou',
    'observacao_alterada',
    'status_alterado'
);

CREATE TYPE lista_espera_status AS ENUM (
    'aguardando',
    'chamado',
    'convertido',
    'cancelado'
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
    endereco TEXT,
    cidade VARCHAR(120),
    estado VARCHAR(120),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profissional (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
    especialidade VARCHAR(150),
    telefone VARCHAR(30),
    email VARCHAR(255) UNIQUE,
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
    documento VARCHAR(50),
    data_nascimento DATE,
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cliente_documento_unico UNIQUE (documento)
);

CREATE TABLE servico (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT servico_duracao_positiva CHECK (duracao_minutos > 0)
);

CREATE TABLE profissional_servico (
    id BIGSERIAL PRIMARY KEY,
    profissional_id BIGINT NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    servico_id BIGINT NOT NULL REFERENCES servico(id) ON DELETE CASCADE,
    preco NUMERIC(10, 2),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profissional_servico_unico UNIQUE (profissional_id, servico_id)
);

CREATE TABLE profissional_unidade (
    id BIGSERIAL PRIMARY KEY,
    profissional_id BIGINT NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    unidade_id BIGINT NOT NULL REFERENCES unidade(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profissional_unidade_unico UNIQUE (profissional_id, unidade_id)
);

CREATE TABLE disponibilidade (
    id BIGSERIAL PRIMARY KEY,
    profissional_id BIGINT NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    unidade_id BIGINT REFERENCES unidade(id) ON DELETE SET NULL,
    dia_semana SMALLINT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    intervalo_minutos INTEGER,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT disponibilidade_dia_semana_valido CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT disponibilidade_intervalo_valido CHECK (hora_inicio < hora_fim),
    CONSTRAINT disponibilidade_intervalo_minutos_valido CHECK (
        intervalo_minutos IS NULL OR intervalo_minutos >= 0
    )
);

CREATE TABLE bloqueio_agenda (
    id BIGSERIAL PRIMARY KEY,
    profissional_id BIGINT NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    unidade_id BIGINT REFERENCES unidade(id) ON DELETE SET NULL,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    motivo TEXT,
    dia_inteiro BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
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
    criado_por BIGINT REFERENCES usuario(id) ON DELETE SET NULL,
    reagendado_de_agendamento_id BIGINT REFERENCES agendamento(id) ON DELETE SET NULL,
    data_hora_inicio TIMESTAMPTZ NOT NULL,
    data_hora_fim TIMESTAMPTZ NOT NULL,
    status agendamento_status NOT NULL DEFAULT 'agendado',
    status_confirmacao confirmacao_status NOT NULL DEFAULT 'pendente',
    observacoes TEXT,
    observacoes_internas TEXT,
    motivo_cancelamento TEXT,
    cancelado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT agendamento_intervalo_valido CHECK (data_hora_inicio < data_hora_fim)
);

CREATE TABLE historico_agendamento (
    id BIGSERIAL PRIMARY KEY,
    agendamento_id BIGINT NOT NULL REFERENCES agendamento(id) ON DELETE CASCADE,
    usuario_id BIGINT REFERENCES usuario(id) ON DELETE SET NULL,
    acao historico_acao NOT NULL,
    descricao TEXT,
    metadata JSONB,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lista_espera (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    profissional_id BIGINT REFERENCES profissional(id) ON DELETE SET NULL,
    servico_id BIGINT REFERENCES servico(id) ON DELETE SET NULL,
    unidade_id BIGINT REFERENCES unidade(id) ON DELETE SET NULL,
    data_preferida DATE,
    periodo_preferido VARCHAR(40),
    observacoes TEXT,
    status lista_espera_status NOT NULL DEFAULT 'aguardando',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profissional_usuario_id ON profissional(usuario_id);
CREATE INDEX idx_profissional_email ON profissional(email);
CREATE INDEX idx_cliente_email ON cliente(email);
CREATE INDEX idx_cliente_documento ON cliente(documento);
CREATE INDEX idx_profissional_servico_profissional ON profissional_servico(profissional_id);
CREATE INDEX idx_profissional_servico_servico ON profissional_servico(servico_id);
CREATE INDEX idx_profissional_unidade_profissional ON profissional_unidade(profissional_id);
CREATE INDEX idx_profissional_unidade_unidade ON profissional_unidade(unidade_id);
CREATE INDEX idx_disponibilidade_profissional_dia ON disponibilidade(profissional_id, dia_semana);
CREATE INDEX idx_bloqueio_profissional_intervalo ON bloqueio_agenda(profissional_id, data_inicio, data_fim);
CREATE INDEX idx_agendamento_profissional_inicio ON agendamento(profissional_id, data_hora_inicio);
CREATE INDEX idx_agendamento_cliente_inicio ON agendamento(cliente_id, data_hora_inicio);
CREATE INDEX idx_agendamento_status ON agendamento(status);
CREATE INDEX idx_historico_agendamento_data ON historico_agendamento(agendamento_id, criado_em DESC);
CREATE INDEX idx_lista_espera_profissional ON lista_espera(profissional_id);
CREATE INDEX idx_lista_espera_status ON lista_espera(status);

ALTER TABLE disponibilidade
    ADD CONSTRAINT disponibilidade_sem_sobreposicao
    EXCLUDE USING gist (
        profissional_id WITH =,
        dia_semana WITH =,
        int4range(
            ((EXTRACT(HOUR FROM hora_inicio)::INTEGER * 60) + EXTRACT(MINUTE FROM hora_inicio)::INTEGER),
            ((EXTRACT(HOUR FROM hora_fim)::INTEGER * 60) + EXTRACT(MINUTE FROM hora_fim)::INTEGER),
            '[)'
        ) WITH &&
    )
    WHERE (ativo = TRUE);

ALTER TABLE agendamento
    ADD CONSTRAINT agendamento_sem_conflito
    EXCLUDE USING gist (
        profissional_id WITH =,
        tstzrange(data_hora_inicio, data_hora_fim, '[)') WITH &&
    )
    WHERE (status IN ('agendado', 'confirmado', 'em_atendimento'));

ALTER TABLE bloqueio_agenda
    ADD CONSTRAINT bloqueio_sem_sobreposicao
    EXCLUDE USING gist (
        profissional_id WITH =,
        tstzrange(data_inicio, data_fim, '[)') WITH &&
    )
    WHERE (ativo = TRUE);

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
     WHERE id = NEW.servico_id
       AND ativo = TRUE;

    IF v_duracao_minutos IS NULL THEN
        RAISE EXCEPTION 'Servico % nao encontrado ou inativo para o agendamento.', NEW.servico_id;
    END IF;

    NEW.data_hora_fim := NEW.data_hora_inicio + make_interval(mins => v_duracao_minutos);

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validar_profissional_servico_do_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM profissional_servico ps
         WHERE ps.profissional_id = NEW.profissional_id
           AND ps.servico_id = NEW.servico_id
           AND ps.ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'O profissional % nao oferece o servico %.', NEW.profissional_id, NEW.servico_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validar_unidade_do_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.unidade_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM profissional_unidade pu
         WHERE pu.profissional_id = NEW.profissional_id
           AND pu.unidade_id = NEW.unidade_id
           AND pu.ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'O profissional % nao esta vinculado a unidade %.', NEW.profissional_id, NEW.unidade_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validar_disponibilidade_vinculo_unidade()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.unidade_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM profissional_unidade pu
         WHERE pu.profissional_id = NEW.profissional_id
           AND pu.unidade_id = NEW.unidade_id
           AND pu.ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'O profissional % nao esta vinculado a unidade %.', NEW.profissional_id, NEW.unidade_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validar_bloqueio_vinculo_unidade()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.unidade_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM profissional_unidade pu
         WHERE pu.profissional_id = NEW.profissional_id
           AND pu.unidade_id = NEW.unidade_id
           AND pu.ativo = TRUE
    ) THEN
        RAISE EXCEPTION 'O profissional % nao esta vinculado a unidade %.', NEW.profissional_id, NEW.unidade_id;
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
           AND b.ativo = TRUE
           AND tstzrange(b.data_inicio, b.data_fim, '[)') &&
               tstzrange(NEW.data_hora_inicio, NEW.data_hora_fim, '[)')
    ) THEN
        RAISE EXCEPTION 'Existe bloqueio de agenda para o profissional % no periodo informado.', NEW.profissional_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION ajustar_campos_de_cancelamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'cancelado' AND NEW.cancelado_em IS NULL THEN
        NEW.cancelado_em := NOW();
    END IF;

    IF NEW.status <> 'cancelado' THEN
        NEW.cancelado_em := NULL;
        NEW.motivo_cancelamento := NULL;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validar_reagendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.reagendado_de_agendamento_id IS NOT NULL AND NEW.reagendado_de_agendamento_id = NEW.id THEN
        RAISE EXCEPTION 'Um agendamento nao pode ser reagendado a partir dele mesmo.';
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

CREATE TRIGGER tg_disponibilidade_validar_unidade
BEFORE INSERT OR UPDATE OF profissional_id, unidade_id
ON disponibilidade
FOR EACH ROW
EXECUTE FUNCTION validar_disponibilidade_vinculo_unidade();

CREATE TRIGGER tg_bloqueio_agenda_validar_unidade
BEFORE INSERT OR UPDATE OF profissional_id, unidade_id
ON bloqueio_agenda
FOR EACH ROW
EXECUTE FUNCTION validar_bloqueio_vinculo_unidade();

CREATE TRIGGER tg_agendamento_definir_fim
BEFORE INSERT OR UPDATE OF servico_id, data_hora_inicio
ON agendamento
FOR EACH ROW
EXECUTE FUNCTION definir_data_hora_fim_por_servico();

CREATE TRIGGER tg_agendamento_validar_profissional_servico
BEFORE INSERT OR UPDATE OF profissional_id, servico_id
ON agendamento
FOR EACH ROW
EXECUTE FUNCTION validar_profissional_servico_do_agendamento();

CREATE TRIGGER tg_agendamento_validar_unidade
BEFORE INSERT OR UPDATE OF profissional_id, unidade_id
ON agendamento
FOR EACH ROW
EXECUTE FUNCTION validar_unidade_do_agendamento();

CREATE TRIGGER tg_agendamento_validar_bloqueio
BEFORE INSERT OR UPDATE OF profissional_id, data_hora_inicio, servico_id, status
ON agendamento
FOR EACH ROW
WHEN (NEW.status IN ('agendado', 'confirmado', 'em_atendimento'))
EXECUTE FUNCTION validar_agendamento_contra_bloqueio();

CREATE TRIGGER tg_agendamento_ajustar_cancelamento
BEFORE INSERT OR UPDATE OF status, motivo_cancelamento
ON agendamento
FOR EACH ROW
EXECUTE FUNCTION ajustar_campos_de_cancelamento();

CREATE TRIGGER tg_agendamento_validar_reagendamento
BEFORE INSERT OR UPDATE OF reagendado_de_agendamento_id
ON agendamento
FOR EACH ROW
EXECUTE FUNCTION validar_reagendamento();

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

CREATE TRIGGER tg_profissional_servico_atualizado_em
BEFORE UPDATE ON profissional_servico
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tg_profissional_unidade_atualizado_em
BEFORE UPDATE ON profissional_unidade
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
