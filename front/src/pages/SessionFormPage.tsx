import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { createSession, fetchSession, updateSession } from "../api/sessions"
import { listGames } from "../api/games"
import { queryKeys } from "../store/queryKeys"
import { FormField } from "../components/forms/FormField"

const sessionSchema = z.object({
  title: z.string().min(3, "Titre trop court"),
  location: z.string().min(1, "Lieu requis"),
  startDatetime: z.string().min(1, "Date requise"),
  games: z
    .array(
      z.object({
        gameId: z.coerce.number().int().positive(),
        order: z.coerce.number().int().min(1)
      })
    )
    .optional()
})

type SessionFormValues = z.infer<typeof sessionSchema>

export const SessionFormPage = () => {
  const { id } = useParams<{ id?: string }>()
  const isEditing = Boolean(id)
  const sessionId = isEditing ? Number(id) : undefined
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: games } = useQuery({
    queryKey: queryKeys.games,
    queryFn: listGames
  })

  const { data: sessionData } = useQuery({
    queryKey: sessionId ? queryKeys.session(sessionId) : ["session", "new"],
    queryFn: () => fetchSession(sessionId!),
    enabled: isEditing && Number.isFinite(sessionId)
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      location: "",
      startDatetime: new Date().toISOString().slice(0, 16),
      games: []
    }
  })

  const { fields, append, remove, replace } = useFieldArray({
    name: "games",
    control
  })

  useEffect(() => {
    if (!isEditing || !sessionData) {
      return
    }

    const values: SessionFormValues = {
      title: sessionData.title,
      location: sessionData.location,
      startDatetime: sessionData.startDatetime.slice(0, 16),
      games:
        sessionData.games?.map((sessionGame) => ({
          gameId: sessionGame.gameId,
          order: sessionGame.order
        })) ?? []
    }
    reset(values)
    replace(values.games ?? [])
  }, [isEditing, sessionData, reset, replace])

  const createMutation = useMutation({
    mutationFn: createSession,
    onSuccess: async (session) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      navigate(`/sessions/${session.id}`)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: SessionFormValues) => updateSession(sessionId!, values),
    onSuccess: async (session) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.session(session.id) })
      ])
      navigate(`/sessions/${session.id}`)
    }
  })

  const onSubmit = handleSubmit(async (values) => {
    if (isEditing && sessionId) {
      await updateMutation.mutateAsync(values)
    } else {
      await createMutation.mutateAsync(values)
    }
  })

  return (
    <div className="card">
      <h1>{isEditing ? "Modifier la session" : "Creer une session"}</h1>
      <form className="form-grid" onSubmit={onSubmit}>
        <FormField label="Titre" {...register("title")} error={errors.title} />
        <FormField label="Lieu" {...register("location")} error={errors.location} />
        <FormField label="Date et heure" type="datetime-local" {...register("startDatetime")} error={errors.startDatetime} />

        <section>
          <h2>Jeux programmes</h2>
          <div className="form-grid">
            {fields.map((field, index) => (
              <div key={field.id} className="card" style={{ padding: "1rem", gap: "0.6rem" }}>
                <label>
                  <span>Jeu</span>
                  <select {...register(`games.${index}.gameId` as const, { valueAsNumber: true })}>
                    <option value="">Selectionner un jeu</option>
                    {games?.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Ordre</span>
                  <input type="number" min={1} {...register(`games.${index}.order` as const, { valueAsNumber: true })} />
                </label>
                <button type="button" className="btn" onClick={() => remove(index)}>
                  Retirer
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn secondary" onClick={() => append({ gameId: 0, order: fields.length + 1 })}>
            Ajouter un jeu
          </button>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn secondary" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? "Enregistrer" : "Creer"}
          </button>
        </div>
      </form>
    </div>
  )
}
