import { useForm } from 'react-hook-form'
import { useTranslation } from "react-i18next"
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useAuth } from '../authentication/useAuth'
import { FormField } from '../components/forms/FormField'

const loginSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
  password: z.string().min(1, 'auth.passwordRequired')
})

type LoginForm = z.infer<typeof loginSchema>

export const LoginPage = () => {
  const { login, loading } = useAuth()
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = handleSubmit(async (values) => {
    await login(values.email, values.password)
  })

  return (
    <div className="page-centered">
      <div className="card" style={{ width: 'min(420px, 100%)' }}>
        <h2>{t('auth.login')}</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <FormField label={t('auth.email')} type="email" {...register('email')} error={errors.email ? { ...errors.email, message: t(errors.email.message as string) } : undefined} />
          <FormField label={t('auth.password')} type="password" {...register('password')} error={errors.password ? { ...errors.password, message: t(errors.password.message as string) } : undefined} />
          <div className="form-actions">
            <button type="submit" className="btn secondary" disabled={loading}>
              {t('auth.loginBtn')}
            </button>
          </div>
        </form>
        <p>
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  )
}

