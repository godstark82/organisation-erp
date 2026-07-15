import { z } from "zod"

export const clientFormSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  client_name: z.string().min(2, "Contact name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional().nullable(),
  gst: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "lead", "archived"]),
})

export type ClientFormInput = z.infer<typeof clientFormSchema>

export const clientFormDefaults: ClientFormInput = {
  company_name: "",
  client_name: "",
  email: "",
  phone: "",
  gst: "",
  address: "",
  country: "",
  notes: "",
  status: "lead",
}
