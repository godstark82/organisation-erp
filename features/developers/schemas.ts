import { z } from "zod"

export const STAFF_ROLES = [
  "developer",
  "designer",
  "manager",
  "accountant",
] as const

export const developerFormSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  role: z.enum(STAFF_ROLES).default("developer"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
})

export const createDeveloperSchema = developerFormSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const updateDeveloperSchema = developerFormSchema
  .omit({ password: true, email: true })
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  })

export type DeveloperFormInput = z.infer<typeof developerFormSchema>

export const developerFormDefaults: DeveloperFormInput = {
  full_name: "",
  email: "",
  phone: "",
  title: "",
  role: "developer",
  password: "",
}
