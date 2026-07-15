-- Fix 42P17: infinite recursion between tasks and task_assignees RLS policies.
-- tasks policies queried task_assignees; task_assignees policies queried tasks.

CREATE OR REPLACE FUNCTION public.is_task_assignee(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.task_assignees
    WHERE task_id = p_task_id
      AND user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.task_in_current_org(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE id = p_task_id
      AND organization_id = public.current_user_org_id()
  );
END;
$$;

DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.is_org_admin()
      OR public.is_project_member(project_id)
      OR public.is_task_assignee(id)
      OR (
        public.current_user_role() = 'client'
        AND project_id IN (
          SELECT p.id FROM public.projects p
          JOIN public.clients c ON c.id = p.client_id
          WHERE c.portal_user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS tasks_update ON public.tasks;
CREATE POLICY tasks_update ON public.tasks FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND public.is_internal_staff()
    AND (
      public.is_org_admin()
      OR public.is_project_member(project_id)
      OR public.is_task_assignee(id)
    )
  );

DROP POLICY IF EXISTS task_assignees_all ON public.task_assignees;
CREATE POLICY task_assignees_all ON public.task_assignees FOR ALL
  USING (public.task_in_current_org(task_id))
  WITH CHECK (public.task_in_current_org(task_id));
