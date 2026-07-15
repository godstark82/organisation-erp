"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useActionState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { login, type AuthActionState } from "@/features/auth/actions"
import { loginSchema, type LoginInput } from "@/features/auth/schemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Description, FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"

const initialState: AuthActionState = {}

export default function LoginPage() {
  const [state, formAction, actionPending] = useActionState(login, initialState)
  const [isPending, startTransition] = useTransition()
  const pending = actionPending || isPending
  const demoMode = process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true"

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData()
    formData.set("email", data.email)
    formData.set("password", data.password)
    startTransition(() => {
      formAction(formData)
    })
  })

  return (
    <Card className="border-border/60 shadow-lg backdrop-blur-sm">
      <CardHeader title="Welcome back" description="Sign in to your AgencyOS workspace" />
      <CardContent>
        {demoMode && (
          <Note intent="info" className="mb-6 text-sm">
            Demo mode: use any credentials
          </Note>
        )}

        {state?.error && (
          <Note intent="danger" className="mb-6 text-sm">
            {state.error}
          </Note>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
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

          <TextField isRequired isInvalid={!!errors.password || !!state?.fieldErrors?.password}>
            <div className="flex items-center justify-between gap-2">
              <Label>Password</Label>
              <Link
                href="/forgot-password"
                className="text-primary text-xs hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            <FieldError>
              {errors.password?.message ?? state?.fieldErrors?.password?.[0]}
            </FieldError>
          </TextField>

          <Button type="submit" intent="primary" className="w-full" isDisabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <Description className="mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </Description>
      </CardContent>
    </Card>
  )
}
