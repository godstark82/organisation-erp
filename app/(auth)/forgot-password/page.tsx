"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useActionState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { forgotPassword, type AuthActionState } from "@/features/auth/actions"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Description, FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"

const initialState: AuthActionState = {}

export default function ForgotPasswordPage() {
  const [state, formAction, actionPending] = useActionState(
    forgotPassword,
    initialState
  )
  const [isPending, startTransition] = useTransition()
  const pending = actionPending || isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData()
    formData.set("email", data.email)
    startTransition(() => {
      formAction(formData)
    })
  })

  return (
    <Card className="border-border/60 shadow-lg backdrop-blur-sm">
      <CardHeader
        title="Reset password"
        description="We'll send you a link to reset your password"
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

          <Button type="submit" intent="primary" className="w-full" isDisabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <Description className="mt-6 text-center">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </Description>
      </CardContent>
    </Card>
  )
}
