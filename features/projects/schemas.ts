import { z } from "zod"
import { PROJECT_STATUSES, PRIORITIES } from "@/lib/constants"

const projectStatusValues = PROJECT_STATUSES.map((s) => s.value) as [
  (typeof PROJECT_STATUSES)[number]["value"],
  ...(typeof PROJECT_STATUSES)[number]["value"][],
]

const priorityValues = PRIORITIES.map((p) => p.value) as [
  (typeof PRIORITIES)[number]["value"],
  ...(typeof PRIORITIES)[number]["value"][],
]

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  client_id: z.string().uuid("Select a client").optional().or(z.literal("")),
  description: z.string().optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(priorityValues).default("medium"),
  budget: z.coerce.number().min(0, "Budget must be positive").default(0),
  status: z.enum(projectStatusValues).default("planning"),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const addProjectMemberSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.string().min(1, "Role is required"),
  estimated_hours: z.coerce.number().min(0).default(0),
})

export const addProjectMembersSchema = z.object({
  project_id: z.string().uuid(),
  user_ids: z.array(z.string().uuid()).min(1, "Select at least one developer"),
  role: z.string().min(1, "Role is required"),
  estimated_hours: z.coerce.number().min(0).default(0),
})

export const createMilestoneSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.coerce.number().min(0).default(0),
  due_date: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "overdue"]).default("pending"),
})

export const updateMilestoneSchema = createMilestoneSchema
  .omit({ project_id: true })
  .partial()
  .extend({ id: z.string().uuid() })

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>

export const projectCategorySchema = z.object({
  name: z.string().min(2, "Category name is required").max(80),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #2563eb")
    .optional()
    .or(z.literal("")),
})

export const updateProjectCategorySchema = projectCategorySchema.partial().extend({
  id: z.string().uuid(),
})

export type ProjectCategoryInput = z.infer<typeof projectCategorySchema>
