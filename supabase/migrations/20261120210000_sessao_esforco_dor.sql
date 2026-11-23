-- Como foi o treino: esforço de 1 a 5 e onde sentiu dor
alter table public.sessions add column if not exists esforco smallint;
alter table public.sessions drop constraint if exists sessions_esforco_faixa;
alter table public.sessions add constraint sessions_esforco_faixa check (esforco is null or esforco between 1 and 5);
alter table public.sessions add column if not exists dor text[];
alter table public.sessions drop constraint if exists sessions_dor_tam;
alter table public.sessions add constraint sessions_dor_tam check (dor is null or cardinality(dor) <= 8);
