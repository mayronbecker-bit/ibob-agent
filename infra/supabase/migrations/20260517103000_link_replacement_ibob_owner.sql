-- Link the replacement authenticated user as iBob owner.
-- Keeps existing owners active until the new login is validated.

do $$
declare
  owner_user_id uuid := 'b406e0b9-9bda-4b75-8c35-ed27a588d1b0';
  owner_email text;
begin
  select email
    into owner_email
  from auth.users
  where id = owner_user_id;

  if owner_email is null then
    raise exception 'Auth user % was not found or has no email.', owner_user_id;
  end if;

  insert into public.user_profiles (user_id, full_name, email)
  values (owner_user_id, 'Mayron', owner_email)
  on conflict (user_id) do update
  set email = excluded.email,
      updated_at = now();

  insert into public.client_memberships (client_id, user_id, role, status)
  values ('client-ibob', owner_user_id, 'owner', 'active')
  on conflict (client_id, user_id) do update
  set role = 'owner',
      status = 'active',
      updated_at = now();
end $$;
