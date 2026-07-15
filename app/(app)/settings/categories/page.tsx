import { CategoriesManager } from "@/features/projects/components/categories-manager"
import { requirePermission } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  listProjectCategories,
  seedDefaultProjectCategories,
} from "@/lib/repositories/projects.repository"

export default async function CategoriesSettingsPage() {
  const session = await requirePermission("settings.view")
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID

  let categories = await listProjectCategories(orgId)
  if (categories.length === 0) {
    categories = await seedDefaultProjectCategories(orgId)
  }

  return <CategoriesManager categories={categories} />
}
