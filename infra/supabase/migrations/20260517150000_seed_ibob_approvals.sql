-- Seed initial iBob approvals and add a supervised decision function.
-- Decisions update proposal state only; no external ad account execution happens here.

create or replace function public.record_proposal_decision(
  target_proposal_id uuid,
  decision public.approval_decision,
  justification text
)
returns public.approvals
language plpgsql
security definer
set search_path = public
as $$
declare
  target_proposal public.proposals%rowtype;
  created_approval public.approvals%rowtype;
  clean_justification text;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  clean_justification := nullif(trim(justification), '');

  if clean_justification is null then
    raise exception 'justification_required' using errcode = '22004';
  end if;

  select *
  into target_proposal
  from public.proposals
  where id = target_proposal_id
  for update;

  if not found then
    raise exception 'proposal_not_found' using errcode = 'P0002';
  end if;

  if not public.current_user_has_role(
    target_proposal.client_id,
    array['owner', 'admin', 'approver']::public.app_role[]
  ) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if target_proposal.status <> 'pending' then
    raise exception 'proposal_already_decided' using errcode = 'P0001';
  end if;

  insert into public.approvals (
    proposal_id,
    client_id,
    approver_user_id,
    decision,
    justification
  )
  values (
    target_proposal.id,
    target_proposal.client_id,
    (select auth.uid()),
    decision,
    clean_justification
  )
  returning * into created_approval;

  update public.proposals
  set status = case decision
    when 'approved' then 'approved'::public.proposal_status
    when 'rejected' then 'rejected'::public.proposal_status
    else 'deferred'::public.proposal_status
  end
  where id = target_proposal.id;

  return created_approval;
end;
$$;

revoke all on function public.record_proposal_decision(uuid, public.approval_decision, text) from public;
grant execute on function public.record_proposal_decision(uuid, public.approval_decision, text) to authenticated;

with primary_approver as (
  select user_id
  from public.client_memberships
  where client_id = 'client-ibob'
    and status = 'active'
    and role in ('owner', 'admin', 'approver')
  order by case role
    when 'owner' then 1
    when 'admin' then 2
    else 3
  end
  limit 1
)
insert into public.approvals (
  id,
  proposal_id,
  client_id,
  approver_user_id,
  decision,
  justification,
  decided_at
)
select
  seeded.id,
  seeded.proposal_id,
  'client-ibob',
  primary_approver.user_id,
  seeded.decision::public.approval_decision,
  seeded.justification,
  seeded.decided_at
from primary_approver
cross join (
  values
    (
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a2000000-0000-4000-8000-000000000003'::uuid,
      'approved',
      'Dados claros de baixo desempenho. Risco minimo de pausa, redistribuicao de budget faz sentido.',
      now() - interval '1 day 1 hour'
    ),
    (
      'a3000000-0000-4000-8000-000000000002'::uuid,
      'a2000000-0000-4000-8000-000000000004'::uuid,
      'rejected',
      'Dados do Meta desatualizados. Aguardar sincronizacao antes de qualquer mudanca de audiencia.',
      now() - interval '23 hours'
    ),
    (
      'a3000000-0000-4000-8000-000000000003'::uuid,
      'a2000000-0000-4000-8000-000000000005'::uuid,
      'approved',
      'Diferenca de CTR expressiva e amostra suficiente. Aprovado para execucao supervisionada.',
      now() - interval '2 days 1 hour'
    )
) as seeded(id, proposal_id, decision, justification, decided_at)
where exists (
  select 1
  from public.proposals
  where id = seeded.proposal_id
    and client_id = 'client-ibob'
)
on conflict (id) do update
set proposal_id = excluded.proposal_id,
    client_id = excluded.client_id,
    approver_user_id = excluded.approver_user_id,
    decision = excluded.decision,
    justification = excluded.justification,
    decided_at = excluded.decided_at;
