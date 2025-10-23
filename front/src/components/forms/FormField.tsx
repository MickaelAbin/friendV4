import type { FieldError } from 'react-hook-form'
import clsx from 'clsx'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, id, className, ...rest }) => {
  const inputId = id ?? rest.name
  return (
    <label className={clsx('form-field', className)} htmlFor={inputId}>
      <span className="form-label">{label}</span>
      <input id={inputId} {...rest} />
      {error && <span className="form-error">{error.message}</span>}
    </label>
  )
}

