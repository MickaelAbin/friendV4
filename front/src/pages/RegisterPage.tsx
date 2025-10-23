import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router-dom"
import { useAuth } from "../authentication/useAuth"
import { FormField } from "../components/forms/FormField"

const registerSchema = z
  .object({
    username: z.string().min(3, "Au moins 3 caracteres"),
    displayName: z.string().min(1, "Nom affiche requis"),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "8 caracteres minimum"),
    confirmPassword: z.string()
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"]
  })

type RegisterForm = z.infer<typeof registerSchema>

export const RegisterPage = () => {
  const { register: signup, loading } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = handleSubmit(async ({ confirmPassword, ...values }) => {
    await signup(values)
  })

  return (
    <div className="page-centered">
      <div className="card" style={{ width: "min(480px, 100%)" }}>
        <h2>Creer un compte</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <FormField label="Nom d'utilisateur" {...register("username")} error={errors.username} />
          <FormField label="Nom affiche" {...register("displayName")} error={errors.displayName} />
          <FormField label="Email" type="email" {...register("email")} error={errors.email} />
          <FormField label="Mot de passe" type="password" {...register("password")} error={errors.password} />
          <FormField
            label="Confirmer le mot de passe"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword}
          />
          <div className="form-actions">
            <button type="submit" className="btn secondary" disabled={loading}>
              S'inscrire
            </button>
          </div>
        </form>
        <p>
          Deja inscrit ? <Link to="/login">Connectez-vous</Link>
        </p>
      </div>
    </div>
  )
}
