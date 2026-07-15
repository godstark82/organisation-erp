-- AgencyOS Row Level Security Policies
-- Multi-tenant isolation: every query scoped to current_user_org_id()

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY org_select ON public.organizations FOR SELECT
  USING (id = public.current_user_org_id() OR owner_id = auth.uid());
CREATE POLICY org_update ON public.organizations FOR UPDATE
  USING (id = public.current_user_org_id() AND public.current_user_role() = 'super_admin');
CREATE POLICY org_insert ON public.organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    OR id = auth.uid()
  );
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR (organization_id = public.current_user_org_id() AND public.is_org_admin()));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR (organization_id = public.current_user_org_id() AND public.is_org_admin()));

-- Permissions (global read)
CREATE POLICY permissions_select ON public.permissions FOR SELECT TO authenticated USING (true);

-- Roles
CREATE POLICY roles_select ON public.roles FOR SELECT
  USING (organization_id = public.current_user_org_id() OR organization_id IS NULL);
CREATE POLICY roles_manage ON public.roles FOR ALL
  USING (organization_id = public.current_user_org_id() AND public.current_user_role() = 'super_admin');

CREATE POLICY role_perms_select ON public.role_permissions FOR SELECT
  USING (organization_id = public.current_user_org_id());
CREATE POLICY role_perms_manage ON public.role_permissions FOR ALL
  USING (organization_id = public.current_user_org_id() AND public.current_user_role() = 'super_admin');

-- Clients: staff see all org clients; clients see only their linked client
CREATE POLICY clients_select ON public.clients FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.is_internal_staff()
      OR portal_user_id = auth.uid()
    )
  );
CREATE POLICY clients_insert ON public.clients FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('super_admin', 'manager')
  );
CREATE POLICY clients_update ON public.clients FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('super_admin', 'manager')
  );
CREATE POLICY clients_delete ON public.clients FOR DELETE
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() = 'super_admin'
  );

CREATE POLICY client_contacts_all ON public.client_contacts FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    AND public.is_internal_staff()
  )
  WITH CHECK (organization_id = public.current_user_org_id());

-- Categories & tags
CREATE POLICY categories_all ON public.project_categories FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());
CREATE POLICY tags_all ON public.tags FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

-- Projects
CREATE POLICY projects_select ON public.projects FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.is_org_admin()
      OR public.is_project_member(id)
      OR (
        public.current_user_role() = 'client'
        AND client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
      )
    )
  );
CREATE POLICY projects_insert ON public.projects FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('super_admin', 'manager')
  );
CREATE POLICY projects_update ON public.projects FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND (public.is_org_admin() OR public.is_project_member(id))
  );
CREATE POLICY projects_delete ON public.projects FOR DELETE
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() = 'super_admin'
  );

CREATE POLICY project_tags_all ON public.project_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.organization_id = public.current_user_org_id()
    )
  );

CREATE POLICY project_members_select ON public.project_members FOR SELECT
  USING (organization_id = public.current_user_org_id());
CREATE POLICY project_members_manage ON public.project_members FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (organization_id = public.current_user_org_id());

-- Tasks
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
CREATE POLICY tasks_insert ON public.tasks FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.is_internal_staff()
    AND (public.is_org_admin() OR public.is_project_member(project_id))
  );
CREATE POLICY tasks_update ON public.tasks FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND public.is_internal_staff()
    AND (public.is_org_admin() OR public.is_project_member(project_id)
      OR public.is_task_assignee(id))
  );
CREATE POLICY tasks_delete ON public.tasks FOR DELETE
  USING (
    organization_id = public.current_user_org_id()
    AND public.is_org_admin()
  );

CREATE POLICY task_assignees_all ON public.task_assignees FOR ALL
  USING (public.task_in_current_org(task_id))
  WITH CHECK (public.task_in_current_org(task_id));

CREATE POLICY task_checklists_all ON public.task_checklists FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY task_comments_select ON public.task_comments FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (NOT is_internal OR public.is_internal_staff())
  );
CREATE POLICY task_comments_insert ON public.task_comments FOR INSERT
  WITH CHECK (organization_id = public.current_user_org_id() AND author_id = auth.uid());

-- Time logs
CREATE POLICY time_logs_select ON public.time_logs FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      user_id = auth.uid()
      OR public.is_org_admin()
    )
  );
CREATE POLICY time_logs_insert ON public.time_logs FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND user_id = auth.uid()
    AND public.is_internal_staff()
  );
CREATE POLICY time_logs_update ON public.time_logs FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND (user_id = auth.uid() OR public.is_org_admin())
  );

-- Milestones
CREATE POLICY milestones_select ON public.milestones FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.is_internal_staff()
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
CREATE POLICY milestones_manage ON public.milestones FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (organization_id = public.current_user_org_id());

-- Invoices
CREATE POLICY invoices_select ON public.invoices FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.current_user_role() IN ('super_admin', 'manager', 'accountant')
      OR (
        public.current_user_role() = 'client'
        AND client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
      )
    )
  );
CREATE POLICY invoices_manage ON public.invoices FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('super_admin', 'manager', 'accountant')
  )
  WITH CHECK (organization_id = public.current_user_org_id());

-- Payments: clients can mark paid but NEVER verify
CREATE POLICY payments_select ON public.payments FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.current_user_role() IN ('super_admin', 'manager', 'accountant')
      OR (
        public.current_user_role() = 'client'
        AND client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
      )
    )
  );

CREATE POLICY payments_client_mark_paid ON public.payments FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() = 'client'
    AND client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
    AND status IN ('pending', 'rejected')
  )
  WITH CHECK (
    status = 'client_marked_paid'
    AND verified_by IS NULL
    AND verified_at IS NULL
  );

CREATE POLICY payments_admin_manage ON public.payments FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('super_admin', 'manager', 'accountant')
  )
  WITH CHECK (organization_id = public.current_user_org_id());

-- Prevent clients from setting verified status via trigger
CREATE OR REPLACE FUNCTION public.enforce_payment_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();

  IF user_role = 'client' THEN
    IF NEW.status IN ('verified', 'under_review', 'disputed') THEN
      RAISE EXCEPTION 'Clients cannot verify or dispute payments';
    END IF;
    IF NEW.verified_by IS NOT NULL OR NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'Clients cannot set verification fields';
    END IF;
  END IF;

  IF NEW.status = 'verified' AND user_role NOT IN ('super_admin', 'manager', 'accountant') THEN
    RAISE EXCEPTION 'Only admins can verify payments';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_payment_verification
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_verification();

CREATE POLICY payment_proofs_all ON public.payment_proofs FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY disputes_select ON public.payment_disputes FOR SELECT
  USING (organization_id = public.current_user_org_id());
CREATE POLICY disputes_admin_insert ON public.payment_disputes FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('super_admin', 'manager', 'accountant')
  );
CREATE POLICY disputes_update ON public.payment_disputes FOR UPDATE
  USING (organization_id = public.current_user_org_id());

CREATE POLICY dispute_messages_all ON public.payment_dispute_messages FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id() AND author_id = auth.uid());

-- Comments: hide internal from clients
CREATE POLICY comments_select ON public.comments FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (NOT is_internal OR public.is_internal_staff())
  );
CREATE POLICY comments_insert ON public.comments FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND author_id = auth.uid()
    AND (NOT is_internal OR public.is_internal_staff())
  );
CREATE POLICY comments_update ON public.comments FOR UPDATE
  USING (organization_id = public.current_user_org_id() AND author_id = auth.uid());

-- Internal notes: admins only
CREATE POLICY internal_notes_all ON public.internal_notes FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('super_admin', 'manager')
  )
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() IN ('super_admin', 'manager')
  );

-- Folders & documents
CREATE POLICY folders_all ON public.folders FOR ALL
  USING (organization_id = public.current_user_org_id())
  WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY documents_select ON public.documents FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.is_internal_staff()
      OR (
        is_client_visible
        AND public.current_user_role() = 'client'
        AND (
          client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
          OR project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.clients c ON c.id = p.client_id
            WHERE c.portal_user_id = auth.uid()
          )
        )
      )
    )
  );
CREATE POLICY documents_insert ON public.documents FOR INSERT
  WITH CHECK (organization_id = public.current_user_org_id());
CREATE POLICY documents_delete ON public.documents FOR DELETE
  USING (
    organization_id = public.current_user_org_id()
    AND (uploaded_by = auth.uid() OR public.is_org_admin())
  );

-- Notifications: own only
CREATE POLICY notifications_select ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT
  WITH CHECK (organization_id = public.current_user_org_id());

-- Activity logs
CREATE POLICY activity_select ON public.activity_logs FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND public.is_internal_staff()
  );
CREATE POLICY activity_insert ON public.activity_logs FOR INSERT
  WITH CHECK (organization_id = public.current_user_org_id());

-- Calendar
CREATE POLICY calendar_select ON public.calendar_events FOR SELECT
  USING (organization_id = public.current_user_org_id());
CREATE POLICY calendar_manage ON public.calendar_events FOR ALL
  USING (
    organization_id = public.current_user_org_id()
    AND public.is_internal_staff()
  )
  WITH CHECK (organization_id = public.current_user_org_id());

-- Storage buckets (run in dashboard or via storage API)
-- documents, payment-proofs, avatars, invoices

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
