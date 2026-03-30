import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { fetchSession, createSession, updateSession } from "../api/sessions"
import { listGames } from "../api/games"
import { fetchUsers } from "../api/users"
import { queryKeys } from "../store/queryKeys"
import { useTranslation } from 'react-i18next'
import confetti from "canvas-confetti"
import styles from "../styles/Planner.module.sass"

// Using existing schema with minor tweaks to fit new UX
const sessionSchema = z.object({
  title: z.string().optional(),
  location: z.string().optional(),
  date: z.string().min(1, "planner.dateRequired"),
  time: z.string().min(1, "planner.timeRequired"),
  games: z
    .array(
      z.object({
        gameId: z.coerce.number().int().positive(),
        order: z.coerce.number().int().min(1)
      })
    )
    .optional(),
  participants: z
    .array(
      z.object({
        userId: z.coerce.number().int().positive(),
        statusInvitation: z.enum(["PENDING", "ACCEPTED", "DECLINED"]).optional()
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
  const { t, i18n } = useTranslation()

  const { data: games } = useQuery({
    queryKey: queryKeys.games,
    queryFn: listGames
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
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
    setValue,
    formState: { errors },
    reset
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      location: t('planner.defaultLocation'),
      date: new Date().toISOString().slice(0, 10),
      time: "19:00",
      games: [],
      participants: []
    }
  })

  const { fields: gameFields, append: appendGame, remove: removeGame, replace: replaceGames } = useFieldArray({
    name: "games",
    control
  })

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant, replace: replaceParticipants } = useFieldArray({
    name: "participants",
    control
  })

  const formValues = watch()

  useEffect(() => {
    if (!isEditing || !sessionData) return

    const dt = new Date(sessionData.startDatetime)
    const d = dt.toISOString().slice(0, 10)
    const t = dt.toTimeString().slice(0, 5)

    const values: SessionFormValues = {
      title: sessionData.title,
      location: sessionData.location,
      date: d,
      time: t,
      games: sessionData.games?.map((sessionGame) => ({
        gameId: sessionGame.gameId,
        order: sessionGame.order
      })) ?? [],
      participants: sessionData.participants?.map((p: any) => ({
        userId: p.userId,
        statusInvitation: p.statusInvitation
      })) ?? []
    }
    reset(values)
    replaceGames(values.games ?? [])
    replaceParticipants(values.participants ?? [])
  }, [isEditing, sessionData, reset, replaceGames, replaceParticipants])

  const createMutation = useMutation({
    mutationFn: createSession,
    onSuccess: async (session) => {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#9A3026", "#A07823", "#2C1810"]
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      setTimeout(() => navigate(`/sessions/${session.id}`), 1500)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => updateSession(sessionId!, values),
    onSuccess: async (session) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.session(session.id) })
      ])
      navigate(`/sessions/${session.id}`)
    }
  })

  const onSubmit = handleSubmit(async (values) => {
    const startDatetime = new Date(`${values.date}T${values.time}:00`).toISOString()
    
    const payload = {
      title: values.title || t('planner.sessionTitle', { date: new Date(startDatetime).toLocaleDateString(i18n.language) }),
      location: values.location || t('planner.toBeDefined'),
      startDatetime: startDatetime,
      games: values.games?.map(g => ({
        gameId: Number(g.gameId),
        order: Number(g.order)
      })) ?? [],
      participants: values.participants?.map(p => ({
        userId: Number(p.userId),
        statusInvitation: (p.statusInvitation || "PENDING") as "PENDING" | "ACCEPTED" | "DECLINED"
      })) ?? []
    }

    if (isEditing && sessionId) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
  })

  const toggleGameSelection = (gameId: number) => {
    const existingIndex = gameFields.findIndex(f => f.gameId === gameId)
    if (existingIndex >= 0) {
      removeGame(existingIndex)
    } else {
      appendGame({ gameId, order: gameFields.length + 1 })
    }
  }

  const toggleParticipantSelection = (userId: number) => {
    const existingIndex = participantFields.findIndex(f => f.userId === userId)
    if (existingIndex >= 0) {
      removeParticipant(existingIndex)
    } else {
      appendParticipant({ userId, statusInvitation: "PENDING" })
    }
  }

  // Fallbacks images mock data for rendering
  const getGameCover = (game: any, idx: number) => {
    if (game.imageUrl) return game.imageUrl
    const covers = [
      "https://images.unsplash.com/photo-1548232979-6c55de2cb734?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1610890716171-6b1bb98ffaed?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1629854499420-a61a6b0c6f50?auto=format&fit=crop&w=400&q=80"
    ]
    return covers[idx % covers.length]
  }

  const selectedGamesIds = gameFields.map(f => f.gameId)
  const selectedGamesNames = games?.filter(g => selectedGamesIds.includes(g.id)).map(g => g.name).join(", ") || "-"
  const selectedParticipantsIds = participantFields.map(f => f.userId)

  return (
    <div className={styles.plannerContainer}>
      <div className={styles.header}>
        <h1>{t('planner.title')}</h1>
        <p>{t('planner.subtitle')}</p>
      </div>

      <form onSubmit={onSubmit} className={styles.grid}>
        
        {/* Left Column : When? */}
        <div className={styles.section} style={{ gridColumn: '1' }}>
          <div className={styles.sectionTitle}>
            <div className={styles.stepNumber}>1</div>
            <h2>{t('planner.step1')}</h2>
          </div>

          <label className={styles.fieldTitle}>{t('planner.selectDate')}</label>
          <input 
            type="date" 
            className={styles.inputBox}
            {...register("date")} 
          />
          {errors.date && <p style={{ color:'red' }}>{t(errors.date.message as string)}</p>}
          {errors.time && <p style={{ color:'red' }}>{t(errors.time.message as string)}</p>}

          <label className={styles.fieldTitle}>{t('planner.startTime')}</label>
          <div className={styles.timeToggle}>
            <label>
              <input 
                type="radio" 
                value="19:00" 
                {...register("time")}
              />
              19:00
            </label>
            <label>
              <input 
                type="radio" 
                value="20:30" 
                {...register("time")}
              />
              20:30
            </label>
          </div>
          
          <div className={styles.quoteBox}>
            {t('planner.quote')}
          </div>
        </div>

        {/* Right Column : Game Board Poll */}
        <div className={styles.section} style={{ gridColumn: '2' }}>
          <div className={styles.sectionTitle}>
            <div className={styles.stepNumber}>2</div>
            <h2>{t('planner.step2')}</h2>
            <div className={styles.badge}>{t('planner.multipleChoice')}</div>
          </div>

          <div className={styles.gamesGrid}>
            {games?.map((game, idx) => {
              const isSelected = selectedGamesIds.includes(game.id)
              return (
                <div 
                  key={game.id} 
                  className={`${styles.gameCard} ${isSelected ? styles.selected : ''}`}
                  onClick={() => toggleGameSelection(game.id)}
                >
                  <div className={styles.checkBadge}>✓</div>
                  <img src={getGameCover(game, idx)} alt={game.name} className={styles.cover} />
                  <div className={styles.content}>
                    <h3>{game.name}</h3>
                    <p>{game.minPlayers}-{game.maxPlayers} {t('planner.players')} • {game.averageDuration || 60} {t('planner.min')}</p>
                  </div>
                  <span className={styles.voteBtn}>
                    {isSelected ? t('planner.voted') : t('planner.vote')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Section : Guests & Summary */}
        <div className={`${styles.bottomSection} ${styles.section}`}>
          
          <div className={styles.guestContainer}>
            <div className={styles.sectionTitle}>
              <div className={styles.stepNumber}>3</div>
              <h2>{t('planner.step3')}</h2>
            </div>

            <div className={styles.guestList}>
              {users?.map(user => {
                const isInvited = selectedParticipantsIds.includes(user.id)
                // Default API avatar for real user
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`
                return (
                  <div 
                    key={user.id} 
                    className={`${styles.guestItem} ${isInvited ? styles.selected : ''}`}
                    onClick={() => toggleParticipantSelection(user.id)}
                    style={{
                      cursor: 'pointer',
                      border: isInvited ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                      opacity: isInvited ? 1 : 0.6
                    }}
                  >
                    <img src={avatarUrl} alt={user.displayName} />
                    {user.displayName}
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.summaryPanel}>
             <div className={styles.iconBadge}>💬</div>
             <h3>{t('planner.summary')}</h3>
             
             <div className={styles.summaryItem}>
               <div className={styles.icon}>📅</div>
               <div className={styles.details}>
                 <span className={styles.label}>{t('planner.dateTime')}</span>
                 <span className={styles.value}>
                  {new Date(formValues.date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })} • {formValues.time}
                 </span>
               </div>
             </div>

             <div className={styles.summaryItem}>
               <div className={styles.icon}>🎲</div>
               <div className={styles.details}>
                 <span className={styles.label}>{t('planner.proposedGames')}</span>
                 <span className={styles.value}>{selectedGamesNames}</span>
               </div>
             </div>

             <div className={styles.summaryItem}>
               <div className={styles.icon}>👥</div>
               <div className={styles.details}>
                 <span className={styles.label}>{t('planner.players')}</span>
                 <span className={styles.value}>{participantFields.length} {t('planner.invited')}</span>
               </div>
             </div>

             <button type="submit" className={styles.submitBtn} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending ? t('planner.creatingBtn') : t('planner.createBtn')}
             </button>
             <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--teal)", marginTop: "1rem", letterSpacing: "1px" }}>
               {t('planner.invitesSent')}
             </div>
          </div>

        </div>

      </form>
    </div>
  )
}
