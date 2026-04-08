-- ============================================================
-- RicciFinance — Schema + Seed COMPLETO v2
-- Cole TUDO no SQL Editor do Supabase → Run
-- ============================================================

drop table if exists gastos_flexiveis cascade;
drop table if exists categorias_orcamento cascade;
drop table if exists dividas cascade;
drop table if exists despesas cascade;
drop table if exists receitas cascade;
drop table if exists alunos cascade;

create table alunos (
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

create table receitas (
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

create table despesas (
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

create table dividas (
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

create table categorias_orcamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  icone text default '💰',
  cor text default '#3b82f6',
  orcamento_mensal numeric(10,2) not null default 0,
  essencial boolean not null default false,
  ativo boolean not null default true,
  obs text default '',
  created_at timestamptz default now()
);

create table gastos_flexiveis (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias_orcamento(id) on delete cascade,
  descricao text not null,
  valor numeric(10,2) not null default 0,
  data_gasto date not null default current_date,
  obs text default '',
  created_at timestamptz default now()
);

-- SEED
insert into alunos (nome, modalidade, valor, frequencia, dia_pagamento, ativo) values
  ('Padilha','personal',640,'4x/semana',1,true),
  ('Thiago','personal',200,'2x/semana',1,true),
  ('Natan','personal',540,'3x/semana',3,true),
  ('Humberto','personal',520,'3x/semana',5,true),
  ('Emmanuel & Emmanuel Filho','personal',910,'4x/semana',9,true),
  ('Balena','personal',360,'2x/semana',10,true),
  ('Erick','personal',480,'3x/semana',10,true),
  ('Rafa Fantin','personal',540,'3x/semana',14,true),
  ('Alan','personal',200,'2x/semana',14,true),
  ('Janice','personal',600,'3x/semana',20,true),
  ('Karine','consultoria',250,'mensal',15,true);

insert into receitas (nome, tipo, sub_tipo, valor, dia, status, recorrente) values
  ('Padilha','personal','fixa',640,1,'recebido',true),
  ('Thiago','personal','fixa',200,1,'recebido',true),
  ('Natan','personal','fixa',540,3,'recebido',true),
  ('Humberto','personal','fixa',520,5,'recebido',true),
  ('Emmanuel & Emmanuel Filho','personal','fixa',910,9,'previsto',true),
  ('Balena','personal','fixa',360,10,'previsto',true),
  ('Erick','personal','fixa',480,10,'previsto',true),
  ('Rafa Fantin','personal','fixa',540,14,'previsto',true),
  ('Alan','personal','fixa',200,14,'previsto',true),
  ('Janice','personal','fixa',600,20,'previsto',true),
  ('Karine','consultoria','variavel',250,15,'previsto',false);

insert into despesas (nome, categoria, sub_tipo, valor, dia, essencial, status, recorrente) values
  ('The One Academia','academia','fixa',450,8,true,'previsto',true),
  ('Conserto do Carro','veiculo','fixa',160,6,true,'pago',false),
  ('Cartão Mãe','familia','fixa',1200,9,true,'previsto',true),
  ('Financiamento do Carro','veiculo','fixa',750,14,true,'previsto',true),
  ('Pós Uniguaçu','educacao','fixa',450,20,true,'previsto',true),
  ('Nutrição','saude','fixa',160,25,true,'previsto',true),
  ('Assinaturas','servicos','variavel',120,5,false,'pago',true);

insert into dividas (nome, credor, valor_total, valor_parcela, vencimento, atrasada, prioridade, pago) values
  ('Cartão Nubank','Nubank',250,250,10,true,1,0),
  ('Cartão BB','Banco do Brasil',250,250,15,true,2,0),
  ('Pós-graduação em atraso','Uniguaçu',450,450,20,true,3,0);

insert into categorias_orcamento (nome, icone, cor, orcamento_mensal, essencial) values
  ('Gasolina','⛽','#f59e0b',450,true),
  ('Mercado','🛒','#22c55e',300,true),
  ('iFood','🍔','#ef4444',200,false),
  ('Barbeiro','✂️','#8b5cf6',255,false),
  ('Lazer','🎮','#3b82f6',200,false),
  ('Farmácia','💊','#06b6d4',100,true),
  ('Roupas','👕','#ec4899',150,false),
  ('Outros','📦','#6b7280',100,false);

insert into gastos_flexiveis (categoria_id, descricao, valor, data_gasto)
select id,'Abastecimento semana 1',120,current_date-6 from categorias_orcamento where nome='Gasolina'
union all
select id,'Abastecimento semana 2',115,current_date-1 from categorias_orcamento where nome='Gasolina'
union all
select id,'Compras da semana',185,current_date-3 from categorias_orcamento where nome='Mercado'
union all
select id,'Corte + barba',85,current_date-5 from categorias_orcamento where nome='Barbeiro';
