export type ActionResult = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[]>
}

/** Throw when a server action returns field/errors so useMutation can surface them. */
export function assertActionSuccess<T extends ActionResult>(result: T): T {
  if (result.error || (result.fieldErrors && Object.keys(result.fieldErrors).length > 0)) {
    const message =
      result.error ??
      Object.values(result.fieldErrors ?? {}).flat()[0] ??
      "Request failed"
    const err = new Error(message) as Error & { fieldErrors?: Record<string, string[]> }
    err.fieldErrors = result.fieldErrors
    throw err
  }
  return result
}
