import React, { forwardRef } from 'react'
import type { FieldError } from 'react-hook-form'
import clsx from 'clsx'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const inputId = id ?? rest.name
    return (
      <label className={clsx('form-field', className)} htmlFor={inputId}>
        <span className="form-label">{label}</span>
        <input id={inputId} ref={ref} {...rest} />
        {error && <span className="form-error">{error.message}</span>}
      </label>
    )
  }
)

FormField.displayName = 'FormField'

