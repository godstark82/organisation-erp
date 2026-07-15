-- Allow linked client portal users to create and update their own projects.
-- Developer assignment remains admin-only via project_members_manage.

DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND (
      public.current_user_role() IN ('super_admin', 'manager')
      OR (
        public.current_user_role() = 'client'
        AND client_id IN (
          SELECT id FROM public.clients WHERE portal_user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update ON public.projects FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.is_org_admin()
      OR public.is_project_member(id)
      OR (
        public.current_user_role() = 'client'
        AND client_id IN (
          SELECT id FROM public.clients WHERE portal_user_id = auth.uid()
        )
      )
    )
  );
