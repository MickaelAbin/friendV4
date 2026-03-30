import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router-dom"
import { useAuth } from "../authentication/useAuth"
import { FormField } from "../components/forms/FormField"

const registerSchema = z
  .object({
    username: z.string().min(3, "auth.min3Chars"),
    displayName: z.string().min(1, "auth.displayRequired"),
    email: z.string().email("auth.invalidEmail"),
    password: z.string().min(8, "auth.min8Chars"),
    confirmPassword: z.string()
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "auth.passwordMismatch",
    path: ["confirmPassword"]
  })

type RegisterForm = z.infer<typeof registerSchema>

export const RegisterPage = () => {
  const { register: signup, loading } = useAuth()
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = handleSubmit(async ({ confirmPassword, ...values }) => {
    await signup(values as any)
  })

  return (
    <div className="page-centered">
      <div className="card" style={{ width: "min(480px, 100%)" }}>
        <h2>{t('auth.register')}</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <FormField label={t('auth.username')} {...register("username")} error={errors.username ? { ...errors.username, message: t(errors.username.message as string) } : undefined} />
          <FormField label={t('auth.displayName')} {...register("displayName")} error={errors.displayName ? { ...errors.displayName, message: t(errors.displayName.message as string) } : undefined} />
          <FormField label={t('auth.email')} type="email" {...register("email")} error={errors.email ? { ...errors.email, message: t(errors.email.message as string) } : undefined} />
          <FormField label={t('auth.password')} type="password" {...register("password")} error={errors.password ? { ...errors.password, message: t(errors.password.message as string) } : undefined} />
          <FormField
            label={t('auth.confirmPassword')}
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword ? { ...errors.confirmPassword, message: t(errors.confirmPassword.message as string) } : undefined}
          />
          <div className="form-actions">
            <button type="submit" className="btn secondary" disabled={loading}>
              {t('auth.registerBtn')}
            </button>
          </div>
        </form>
        <p>
          {t('auth.alreadyRegistered')} <Link to="/login">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  )
}
