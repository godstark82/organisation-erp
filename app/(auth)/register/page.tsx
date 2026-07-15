"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useActionState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { register as registerAction, type AuthActionState } from "@/features/auth/actions"
import { registerSchema, type RegisterInput } from "@/features/auth/schemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Description, FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"

const initialState: AuthActionState = {}

export default function RegisterPage() {
  const [state, formAction, actionPending] = useActionState(
    registerAction,
    initialState
  )
  const [isPending, startTransition] = useTransition()
  const pending = actionPending || isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: "",
      fullName: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData()
    formData.set("organizationName", data.organizationName)
    formData.set("fullName", data.fullName)
    formData.set("email", data.email)
    formData.set("password", data.password)
    startTransition(() => {
      formAction(formData)
    })
  })

  return (
    <Card className="border-border/60 shadow-lg backdrop-blur-sm">
      <CardHeader
        title="Create your workspace"
        description="Set up AgencyOS for your agency in minutes"
      />
      <CardContent>
        {state?.success && (
          <Note intent="success" className="mb-6 text-sm">
            {state.success}
          </Note>
        )}

        {state?.error && (
          <Note intent="danger" className="mb-6 text-sm">
            {state.error}
          </Note>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <TextField
            isRequired
            isInvalid={!!errors.organizationName || !!state?.fieldErrors?.organizationName}
          >
            <Label>Organization name</Label>
            <Input
              placeholder="Northwind Creative"
              {...register("organizationName")}
            />
            <FieldError>
              {errors.organizationName?.message ??
                state?.fieldErrors?.organizationName?.[0]}
            </FieldError>
          </TextField>

          <TextField
            isRequired
            isInvalid={!!errors.fullName || !!state?.fieldErrors?.fullName}
          >
            <Label>Full name</Label>
            <Input placeholder="Alex Morgan" {...register("fullName")} />
            <FieldError>
              {errors.fullName?.message ?? state?.fieldErrors?.fullName?.[0]}
            </FieldError>
          </TextField>

          <TextField isRequired isInvalid={!!errors.email || !!state?.fieldErrors?.email}>
            <Label>Email</Label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@agency.com"
              {...register("email")}
            />
            <FieldError>{errors.email?.message ?? state?.fieldErrors?.email?.[0]}</FieldError>
          </TextField>

          <TextField
            isRequired
            isInvalid={!!errors.password || !!state?.fieldErrors?.password}
          >
            <Label>Password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register("password")}
            />
            <FieldError>
              {errors.password?.message ?? state?.fieldErrors?.password?.[0]}
            </FieldError>
          </TextField>

          <Button type="submit" intent="primary" className="w-full" isDisabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <Description className="mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </Description>
      </CardContent>
    </Card>
  )
}
