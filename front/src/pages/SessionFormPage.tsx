import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { createSession, fetchSession, updateSession } from "../api/sessions"
import { listGames } from "../api/games"
import { queryKeys } from "../store/queryKeys"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import styles from "../styles/Wizard.module.sass"

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

const steps = [
  { id: 1, title: "Quoi & Quand ?" },
  { id: 2, title: "Où ?" },
  { id: 3, title: "Les Jeux" },
  { id: 4, title: "Confirmation" }
]

export const SessionFormPage = () => {
  const { id } = useParams<{ id?: string }>()
  const isEditing = Boolean(id)
  const sessionId = isEditing ? Number(id) : undefined
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)

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
    watch,
    trigger,
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

  const formValues = watch()

  useEffect(() => {
    if (!isEditing || !sessionData) return

    const values: SessionFormValues = {
      title: sessionData.title,
      location: sessionData.location,
      startDatetime: sessionData.startDatetime.slice(0, 16),
      games: sessionData.games?.map((sessionGame) => ({
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
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      setTimeout(() => navigate(`/sessions/${session.id}`), 1500)
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

  const nextStep = async () => {
    let isValid = false
    if (currentStep === 1) isValid = await trigger(["title", "startDatetime"])
    if (currentStep === 2) isValid = await trigger("location")
    if (currentStep === 3) isValid = true // Games are optional

    if (isValid) {
      setDirection(1)
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    }
  }

  const prevStep = () => {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      title: values.title!,
      location: values.location!,
      startDatetime: values.startDatetime!,
      games: values.games?.map(g => ({
        gameId: Number(g.gameId),
        order: Number(g.order)
      })) ?? []
    }

    if (isEditing && sessionId) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
  })

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  }

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.progress}>
        {steps.map((step) => (
          <div
            key={step.id}
            className={`${styles.stepIndicator} ${step.id === currentStep ? styles.active : step.id < currentStep ? styles.completed : ""
              }`}
          >
            {step.id < currentStep ? "✓" : step.id}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit}>
        <div className={styles.stepContent}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              style={{ width: "100%", flex: 1 }}
            >
              <h2 className={styles.stepTitle}>{steps[currentStep - 1].title}</h2>

              {currentStep === 1 && (
                <div className={styles.formGroup}>
                  <div className={styles.field}>
                    <label>Titre de la session</label>
                    <input {...register("title")} placeholder="Ex: Soirée Catan" autoFocus />
                    {errors.title && <span style={{ color: "#C0392B" }}>{errors.title.message}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>Quand ?</label>
                    <input type="datetime-local" {...register("startDatetime")} />
                    {errors.startDatetime && <span style={{ color: "#C0392B" }}>{errors.startDatetime.message}</span>}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className={styles.formGroup}>
                  <div className={styles.field}>
                    <label>Où ?</label>
                    <input {...register("location")} placeholder="Ex: Chez Thomas" autoFocus />
                    {errors.location && <span style={{ color: "#C0392B" }}>{errors.location.message}</span>}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className={styles.formGroup}>
                  <div className={styles.gamesList}>
                    {fields.map((field, index) => (
                      <div key={field.id} className={styles.gameItem}>
                        <span style={{ fontWeight: "bold", color: "#7F8C8D" }}>#{index + 1}</span>
                        <select {...register(`games.${index}.gameId` as const, { valueAsNumber: true })}>
                          <option value="">Sélectionner un jeu</option>
                          {games?.map((game) => (
                            <option key={game.id} value={game.id}>
                              {game.name}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn secondary" onClick={() => remove(index)} style={{ padding: "0.4rem 0.8rem" }}>
                          ✕
                        </button>
                        <input type="hidden" {...register(`games.${index}.order` as const, { valueAsNumber: true })} value={index + 1} />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => append({ gameId: 0, order: fields.length + 1 })}
                    style={{ alignSelf: "flex-start", marginTop: "1rem" }}
                  >
                    + Ajouter un jeu
                  </button>
                </div>
              )}

              {currentStep === 4 && (
                <div className={styles.summary}>
                  <div className={styles.summaryItem}>
                    <span>Titre</span>
                    <span>{formValues.title}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Date</span>
                    <span>{new Date(formValues.startDatetime).toLocaleString()}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Lieu</span>
                    <span>{formValues.location}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>Jeux</span>
                    <span>{fields.length} jeu(x) prévu(s)</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className={styles.actions}>
            {currentStep > 1 ? (
              <button type="button" className="btn secondary" onClick={prevStep}>
                Précédent
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < steps.length ? (
              <button type="button" className="btn" onClick={nextStep}>
                Suivant
              </button>
            ) : (
              <button type="submit" className="btn accent" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? "Mettre à jour" : "Lancer les dés !"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

