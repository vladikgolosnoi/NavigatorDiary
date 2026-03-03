import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  error?: string
  children: ReactNode
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <small className="error">{error}</small> : null}
    </label>
  )
}
