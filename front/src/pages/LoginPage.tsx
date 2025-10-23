import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useAuth } from '../authentication/useAuth'
import { FormField } from '../components/forms/FormField'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
})

type LoginForm = z.infer<typeof loginSchema>

export const LoginPage = () => {
  const { login, loading } = useAuth()
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
        <h2>Connexion</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <FormField label="Email" type="email" {...register('email')} error={errors.email} />
          <FormField label="Mot de passe" type="password" {...register('password')} error={errors.password} />
          <div className="form-actions">
            <button type="submit" className="btn secondary" disabled={loading}>
              Se connecter
            </button>
          </div>
        </form>
        <p>
          Pas encore de compte ? <Link to="/register">Inscrivez-vous</Link>
        </p>
      </div>
    </div>
  )
}

