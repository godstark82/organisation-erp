-- Assign invited staff (developers) to an existing org via user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
  org_slug TEXT;
  user_role public.app_role;
  meta_org TEXT;
BEGIN
  org_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'organization_name', '')), '');
  meta_org := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'organization_id', '')), '');
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'developer');

  IF org_name IS NOT NULL THEN
    user_role := 'super_admin';
    org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    org_slug := trim(both '-' from org_slug);
    IF org_slug = '' THEN
      org_slug := 'org-' || substr(NEW.id::text, 1, 8);
    END IF;
    IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) THEN
      org_slug := org_slug || '-' || substr(NEW.id::text, 1, 8);
    END IF;

    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES (org_name, org_slug, NEW.id)
    RETURNING id INTO org_id;

    PERFORM public.seed_default_project_categories(org_id);
  ELSIF meta_org IS NOT NULL THEN
    BEGIN
      org_id := meta_org::uuid;
    EXCEPTION WHEN others THEN
      org_id := NULL;
    END;
    IF org_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.organizations WHERE id = org_id
    ) THEN
      org_id := NULL;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    user_role,
    org_id
  );
  RETURN NEW;
END;
$$;
