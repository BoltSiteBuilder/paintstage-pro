-- ============================================================
-- PaintStage Pro billing + stage metering
-- ------------------------------------------------------------
-- One "stage" = one successful paint render.
--   Crew   ($29/mo) — 50 stages per period
--   Studio ($49/mo) — 100 stages per period
-- 100 is a hard cap on every plan.
--
-- A workspace is the metering subject. Today it is a browser-held
-- uuid; when accounts land it becomes auth.uid() and the RPCs can
-- stop taking it as an argument.
-- ============================================================

create table if not exists public.billing_workspaces (
  workspace_id           uuid primary key,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  plan_id                text check (plan_id in ('crew', 'studio')),
  status                 text not null default 'inactive'
                           check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  period_start           timestamptz,
  period_end             timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.stage_renders (
  id           bigint generated always as identity primary key,
  workspace_id uuid not null,
  rendered_at  timestamptz not null default now()
);

create index if not exists stage_renders_workspace_time_idx
  on public.stage_renders (workspace_id, rendered_at desc);

create index if not exists billing_workspaces_customer_idx
  on public.billing_workspaces (stripe_customer_id);

-- RLS on with no policies: reachable only through the SECURITY DEFINER
-- functions below and through the service role used by the Stripe webhook.
alter table public.billing_workspaces enable row level security;
alter table public.stage_renders      enable row level security;

-- ── Plan allowances ─────────────────────────────────────────
create or replace function public.paintstage_included_stages(p_plan text)
returns integer
language sql
immutable
as $$
  select case p_plan
           when 'studio' then 100
           when 'crew'   then 50
           else 3            -- trial allowance before a plan is chosen
         end;
$$;

-- ── Current usage snapshot ──────────────────────────────────
create or replace function public.paintstage_status_json(p_workspace uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row      public.billing_workspaces;
  v_plan     text;
  v_status   text;
  v_start    timestamptz;
  v_end      timestamptz;
  v_used     integer;
  v_included integer;
begin
  select * into v_row
  from public.billing_workspaces
  where workspace_id = p_workspace;

  v_status := coalesce(v_row.status, 'inactive');
  v_plan   := v_row.plan_id;

  -- Only a live subscription grants its allowance.
  if v_status not in ('active', 'trialing') then
    v_plan := null;
  end if;

  -- Meter against the Stripe billing period when we have one, otherwise
  -- fall back to the calendar month.
  if v_row.period_start is not null
     and v_row.period_end is not null
     and now() >= v_row.period_start
     and now() <  v_row.period_end then
    v_start := v_row.period_start;
    v_end   := v_row.period_end;
  else
    v_start := date_trunc('month', now());
    v_end   := v_start + interval '1 month';
  end if;

  select count(*) into v_used
  from public.stage_renders
  where workspace_id = p_workspace
    and rendered_at >= v_start
    and rendered_at <  v_end;

  -- Nobody renders past 100 in a period, whatever the plan says.
  v_included := least(public.paintstage_included_stages(v_plan), 100);

  return jsonb_build_object(
    'plan_id',         v_plan,
    'status',          v_status,
    'stages_used',     v_used,
    'stages_included', v_included,
    'period_start',    v_start,
    'period_end',      v_end
  );
end;
$$;

create or replace function public.paintstage_billing_status(p_workspace uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.paintstage_status_json(p_workspace);
$$;

-- ── Record one successful render ────────────────────────────
-- Refuses to record (and therefore refuses the render) once the
-- allowance is spent, so the cap cannot be bypassed from the client.
create or replace function public.paintstage_record_stage(p_workspace uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state jsonb;
begin
  v_state := public.paintstage_status_json(p_workspace);

  if (v_state->>'stages_used')::integer >= (v_state->>'stages_included')::integer then
    return v_state || jsonb_build_object('recorded', false);
  end if;

  insert into public.stage_renders (workspace_id) values (p_workspace);

  return public.paintstage_status_json(p_workspace) || jsonb_build_object('recorded', true);
end;
$$;

revoke all on function public.paintstage_included_stages(text)  from public;
revoke all on function public.paintstage_status_json(uuid)      from public;
revoke all on function public.paintstage_billing_status(uuid)   from public;
revoke all on function public.paintstage_record_stage(uuid)     from public;

grant execute on function public.paintstage_billing_status(uuid) to anon, authenticated;
grant execute on function public.paintstage_record_stage(uuid)   to anon, authenticated;
