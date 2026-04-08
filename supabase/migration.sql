-- ============================================================
-- RicciFinance — Schema Supabase
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- RECEITAS
create table if not exists receitas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'personal',
  sub_tipo text not null default 'fixa',
  valor numeric(10,2) not null default 0,
  dia integer not null default 1,
  status text not null default 'previsto',
  recorrente boolean not null default true,
  obs text default '',
  created_at timestamptz default now()
);

-- DESPESAS
create table if not exists despesas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text default '',
  sub_tipo text not null default 'fixa',
  valor numeric(10,2) not null default 0,
  dia integer not null default 1,
  essencial boolean not null default true,
  status text not null default 'previsto',
  recorrente boolean not null default false,
  obs text default '',
  created_at timestamptz default now()
);

-- DÍVIDAS
create table if not exists dividas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  credor text default '',
  valor_total numeric(10,2) not null default 0,
  valor_parcela numeric(10,2) not null default 0,
  vencimento integer not null default 1,
  atrasada boolean not null default false,
  prioridade integer not null default 3,
  obs text default '',
  pago numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- ALUNOS
create table if not exists alunos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  modalidade text not null default 'personal',
  valor numeric(10,2) not null default 0,
  frequencia text default '',
  dia_pagamento integer not null default 1,
  ativo boolean not null default true,
  obs text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- SEED — Dados Iniciais do Rafael
-- ============================================================

-- Renda Fixa
insert into receitas (nome, tipo, sub_tipo, valor, dia, status, recorrente) values
  ('Padilha',                   'personal',    'fixa', 640,  1,  'recebido', true),
  ('Thiago',                    'personal',    'fixa', 200,  1,  'recebido', true),
  ('Natan',                     'personal',    'fixa', 540,  3,  'recebido', true),
  ('Humberto',                  'personal',    'fixa', 520,  5,  'recebido', true),
  ('Emmanuel & Emmanuel Filho', 'personal',    'fixa', 910,  9,  'previsto', true),
  ('Balena',                    'personal',    'fixa', 360,  10, 'previsto', true),
  ('Erick',                     'personal',    'fixa', 480,  10, 'previsto', true),
  ('Rafa Fantin',               'personal',    'fixa', 540,  14, 'previsto', true),
  ('Alan',                      'personal',    'fixa', 200,  14, 'previsto', true),
  ('Janice',                    'personal',    'fixa', 600,  20, 'previsto', true),
  ('Karine',                    'consultoria', 'variavel', 250, 15, 'previsto', false);

-- Contas Fixas
insert into despesas (nome, categoria, sub_tipo, valor, dia, essencial, status, recorrente) values
  ('The One Academia',      'academia',   'fixa', 450,  8,  true, 'previsto', true),
  ('Conserto do Carro',     'veículo',    'fixa', 160,  6,  true, 'pago',     false),
  ('Cartão Mãe',            'família',    'fixa', 1200, 9,  true, 'previsto', true),
  ('Financiamento do Carro','veículo',    'fixa', 750,  14, true, 'previsto', true),
  ('Pós Uniguaçu',          'educação',   'fixa', 450,  20, true, 'previsto', true),
  ('Nutrição',              'saúde',      'fixa', 160,  25, true, 'previsto', true);

-- Gastos Variáveis
insert into despesas (nome, categoria, sub_tipo, valor, dia, essencial, status, recorrente, obs) values
  ('Transporte / Gasolina', 'transporte',  'variavel', 450, 15, true,  'previsto', true, 'Gasolina'),
  ('Assinaturas',           'serviços',    'variavel', 120, 5,  false, 'pago',     true, 'Spotify + Claude'),
  ('Mercado',               'alimentação', 'variavel', 200, 19, true,  'previsto', false,'Final de semana'),
  ('iFood',                 'alimentação', 'variavel', 150, 17, false, 'previsto', false,''),
  ('Barbeiro',              'pessoal',     'variavel', 255, 22, false, 'previsto', false,'');

-- Dívidas
insert into dividas (nome, credor, valor_total, valor_parcela, vencimento, atrasada, prioridade, pago) values
  ('Cartão Nubank',              'Nubank',     250, 250, 10, true, 1, 0),
  ('Cartão BB',                  'Banco do Brasil', 250, 250, 15, true, 2, 0),
  ('Pós-graduação em atraso',    'Uniguaçu',   450, 450, 20, true, 3, 0);

-- Alunos
insert into alunos (nome, modalidade, valor, frequencia, dia_pagamento, ativo) values
  ('Padilha',                   'personal',    640, '4x/semana', 1,  true),
  ('Thiago',                    'personal',    200, '2x/semana', 1,  true),
  ('Natan',                     'personal',    540, '3x/semana', 3,  true),
  ('Humberto',                  'personal',    520, '3x/semana', 5,  true),
  ('Emmanuel & Emmanuel Filho', 'personal',    910, '4x/semana', 9,  true),
  ('Balena',                    'personal',    360, '2x/semana', 10, true),
  ('Erick',                     'personal',    480, '3x/semana', 10, true),
  ('Rafa Fantin',               'personal',    540, '3x/semana', 14, true),
  ('Alan',                      'personal',    200, '2x/semana', 14, true),
  ('Janice',                    'personal',    600, '3x/semana', 20, true),
  ('Karine',                    'consultoria', 250, 'mensal',    15, true);
