create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.app_current_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
    and is_active
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select private.app_current_role()) in ('super_admin', 'admin'),
    false
  )
$$;

revoke all on function private.app_current_role() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.app_current_role() to authenticated;
grant execute on function private.is_admin() to authenticated;

alter policy "profile self or admin read" on public.profiles
  using (id = (select auth.uid()) or (select private.is_admin()));
alter policy "admins manage profiles" on public.profiles
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
alter policy "role candidate read" on public.candidates
  using (
    (select private.is_admin())
    or (
      (select private.app_current_role()) = 'recruiter'
      and (assigned_recruiter_id = (select auth.uid()) or assigned_recruiter_id is null)
    )
    or (
      (select private.app_current_role()) = 'viewer'
      and status in ('approved_for_contact', 'contacted', 'registered', 'accepted')
    )
  );
alter policy "recruitment candidate insert" on public.candidates
  with check ((select private.app_current_role()) in ('super_admin', 'admin', 'recruiter'));
alter policy "assigned candidate update" on public.candidates
  using (
    (select private.is_admin())
    or (
      (select private.app_current_role()) = 'recruiter'
      and (assigned_recruiter_id = (select auth.uid()) or assigned_recruiter_id is null)
    )
  )
  with check (
    (select private.is_admin())
    or (
      (select private.app_current_role()) = 'recruiter'
      and (assigned_recruiter_id = (select auth.uid()) or assigned_recruiter_id is null)
    )
  );
alter policy "recruiters manage own notes" on public.candidate_notes
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));
alter policy "staff add activities" on public.candidate_activities
  with check ((select private.app_current_role()) in ('super_admin', 'admin', 'recruiter'));
alter policy "admins manage queries" on public.search_queries
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
alter policy "staff read queries" on public.search_queries
  using ((select private.app_current_role()) in ('super_admin', 'admin', 'recruiter', 'viewer'));
alter policy "staff draft outreach" on public.outreach_messages
  with check (
    (select private.app_current_role()) in ('super_admin', 'admin', 'recruiter')
    and status = 'draft'
  );
alter policy "authorized outreach update" on public.outreach_messages
  using ((select private.is_admin()) or generated_by = (select auth.uid()))
  with check ((select private.is_admin()) or generated_by = (select auth.uid()));
alter policy "admins read audit" on public.audit_logs
  using ((select private.is_admin()));

drop function public.is_admin();
drop function public.app_current_role();

create index candidates_assigned_recruiter_id_idx on public.candidates (assigned_recruiter_id);
create index candidates_approved_by_idx on public.candidates (approved_by);
create index candidate_notes_candidate_id_idx on public.candidate_notes (candidate_id);
create index candidate_notes_user_id_idx on public.candidate_notes (user_id);
create index candidate_activities_candidate_id_idx on public.candidate_activities (candidate_id);
create index candidate_activities_user_id_idx on public.candidate_activities (user_id);
create index search_queries_created_by_idx on public.search_queries (created_by);
create index outreach_messages_candidate_id_idx on public.outreach_messages (candidate_id);
create index outreach_messages_generated_by_idx on public.outreach_messages (generated_by);
create index outreach_messages_approved_by_idx on public.outreach_messages (approved_by);
create index audit_logs_user_id_idx on public.audit_logs (user_id);
