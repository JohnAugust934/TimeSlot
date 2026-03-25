-- CreateEnum
CREATE TYPE "usuario_tipo" AS ENUM ('admin', 'recepcionista', 'profissional', 'cliente');

-- CreateEnum
CREATE TYPE "agendamento_status" AS ENUM ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'faltou', 'remarcado');

-- CreateEnum
CREATE TYPE "confirmacao_status" AS ENUM ('pendente', 'confirmado', 'recusado');

-- CreateEnum
CREATE TYPE "historico_acao" AS ENUM (
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

-- CreateEnum
CREATE TYPE "lista_espera_status" AS ENUM ('aguardando', 'chamado', 'convertido', 'cancelado');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "tipo" "usuario_tipo" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidade" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "endereco" TEXT,
    "cidade" VARCHAR(120),
    "estado" VARCHAR(120),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissional" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "categoria" VARCHAR(100),
    "especialidade" VARCHAR(150),
    "telefone" VARCHAR(30),
    "email" VARCHAR(255),
    "usuario_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(30),
    "email" VARCHAR(255),
    "documento" VARCHAR(50),
    "data_nascimento" DATE,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servico" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "duracao_minutos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissional_servico" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "preco" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profissional_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissional_unidade" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "unidade_id" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profissional_unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidade" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "unidade_id" TEXT,
    "dia_semana" SMALLINT NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fim" TIME(6) NOT NULL,
    "intervalo_minutos" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disponibilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueio_agenda" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "unidade_id" TEXT,
    "data_inicio" TIMESTAMPTZ(6) NOT NULL,
    "data_fim" TIMESTAMPTZ(6) NOT NULL,
    "motivo" TEXT,
    "dia_inteiro" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueio_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamento" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "unidade_id" TEXT,
    "criado_por" TEXT,
    "reagendado_de_agendamento_id" TEXT,
    "data_hora_inicio" TIMESTAMPTZ(6) NOT NULL,
    "data_hora_fim" TIMESTAMPTZ(6) NOT NULL,
    "status" "agendamento_status" NOT NULL DEFAULT 'agendado',
    "status_confirmacao" "confirmacao_status" NOT NULL DEFAULT 'pendente',
    "observacoes" TEXT,
    "observacoes_internas" TEXT,
    "motivo_cancelamento" TEXT,
    "cancelado_em" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_agendamento" (
    "id" TEXT NOT NULL,
    "agendamento_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "acao" "historico_acao" NOT NULL,
    "descricao" TEXT,
    "metadata" JSONB,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lista_espera" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "profissional_id" TEXT,
    "servico_id" TEXT,
    "unidade_id" TEXT,
    "data_preferida" DATE,
    "periodo_preferido" VARCHAR(40),
    "observacoes" TEXT,
    "status" "lista_espera_status" NOT NULL DEFAULT 'aguardando',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_espera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profissional_usuario_id_key" ON "profissional"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "profissional_email_key" ON "profissional"("email");

-- CreateIndex
CREATE INDEX "idx_profissional_usuario_id" ON "profissional"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_profissional_email" ON "profissional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_documento_unico" ON "cliente"("documento");

-- CreateIndex
CREATE INDEX "idx_cliente_email" ON "cliente"("email");

-- CreateIndex
CREATE INDEX "idx_cliente_documento" ON "cliente"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "profissional_servico_unico" ON "profissional_servico"("profissional_id", "servico_id");

-- CreateIndex
CREATE INDEX "idx_profissional_servico_profissional" ON "profissional_servico"("profissional_id");

-- CreateIndex
CREATE INDEX "idx_profissional_servico_servico" ON "profissional_servico"("servico_id");

-- CreateIndex
CREATE UNIQUE INDEX "profissional_unidade_unico" ON "profissional_unidade"("profissional_id", "unidade_id");

-- CreateIndex
CREATE INDEX "idx_profissional_unidade_profissional" ON "profissional_unidade"("profissional_id");

-- CreateIndex
CREATE INDEX "idx_profissional_unidade_unidade" ON "profissional_unidade"("unidade_id");

-- CreateIndex
CREATE INDEX "idx_disponibilidade_profissional_dia" ON "disponibilidade"("profissional_id", "dia_semana");

-- CreateIndex
CREATE INDEX "idx_bloqueio_profissional_intervalo" ON "bloqueio_agenda"("profissional_id", "data_inicio", "data_fim");

-- CreateIndex
CREATE INDEX "idx_agendamento_profissional_inicio" ON "agendamento"("profissional_id", "data_hora_inicio");

-- CreateIndex
CREATE INDEX "idx_agendamento_cliente_inicio" ON "agendamento"("cliente_id", "data_hora_inicio");

-- CreateIndex
CREATE INDEX "idx_agendamento_status" ON "agendamento"("status");

-- CreateIndex
CREATE INDEX "idx_historico_agendamento_data" ON "historico_agendamento"("agendamento_id", "criado_em" DESC);

-- CreateIndex
CREATE INDEX "idx_lista_espera_profissional" ON "lista_espera"("profissional_id");

-- CreateIndex
CREATE INDEX "idx_lista_espera_status" ON "lista_espera"("status");

-- AddForeignKey
ALTER TABLE "profissional" ADD CONSTRAINT "profissional_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_servico" ADD CONSTRAINT "profissional_servico_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_servico" ADD CONSTRAINT "profissional_servico_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_unidade" ADD CONSTRAINT "profissional_unidade_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_unidade" ADD CONSTRAINT "profissional_unidade_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidade" ADD CONSTRAINT "disponibilidade_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidade" ADD CONSTRAINT "disponibilidade_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueio_agenda" ADD CONSTRAINT "bloqueio_agenda_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueio_agenda" ADD CONSTRAINT "bloqueio_agenda_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_reagendado_de_agendamento_id_fkey" FOREIGN KEY ("reagendado_de_agendamento_id") REFERENCES "agendamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_agendamento" ADD CONSTRAINT "historico_agendamento_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_agendamento" ADD CONSTRAINT "historico_agendamento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_espera" ADD CONSTRAINT "lista_espera_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_espera" ADD CONSTRAINT "lista_espera_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_espera" ADD CONSTRAINT "lista_espera_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_espera" ADD CONSTRAINT "lista_espera_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
