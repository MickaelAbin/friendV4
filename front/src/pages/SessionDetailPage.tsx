import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, Link } from "react-router-dom"
import { fetchSession, recordResults } from "../api/sessions"
import { queryKeys } from "../store/queryKeys"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useAuth } from "../authentication/useAuth"
import { useMemo, useState } from "react"
import type { AxiosError } from "axios"

export const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: session, isLoading, error } = useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: () => fetchSession(sessionId),
    enabled: Number.isFinite(sessionId),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 1
  })

  // Hooks declared unconditionally to keep order stable across renders
  const isOrganizer = user?.id === (session?.organizerId ?? -1)
  const [selectedSessionGameId, setSelectedSessionGameId] = useState<number | undefined>(undefined)
  const participants = useMemo(() => session?.participants ?? [], [session?.participants])

  const [scores, setScores] = useState<Record<number, { score: number; playerRank: number }>>({})

  const updateScore = (userId: number, field: "score" | "playerRank", value: number) => {
    setScores((prev) => ({
      ...prev,
      [userId]: { score: prev[userId]?.score ?? 0, playerRank: prev[userId]?.playerRank ?? 0, [field]: value }
    }))
  }

  const resultsPayload = useMemo(() => {
    return participants
      .map((p) => ({ userId: p.userId, score: scores[p.userId]?.score ?? 0, playerRank: scores[p.userId]?.playerRank ?? 0 }))
      .filter((r) => r.playerRank > 0)
  }, [participants, scores])

  const saveResults = useMutation({
    mutationFn: async () => {
      if (!selectedSessionGameId) return
      return recordResults(sessionId, { sessionGameId: selectedSessionGameId, results: resultsPayload })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      ])
    }
  })

  // Initialize selected game id when session loads
  if (session && selectedSessionGameId === undefined) {
    const first = session.games && session.games.length > 0 ? session.games[0].id : undefined
    if (first !== undefined) setSelectedSessionGameId(first)
  }

  if (!Number.isFinite(sessionId)) {
    return <div className="page-centered">Session invalide</div>
  }

  if (isLoading) {
    return <div className="page-centered">Chargement...</div>
  }

  if (error) {
    const err = error as AxiosError
    if (err.response?.status === 403) {
      return <div className="page-centered">Accès refusé. Rejoignez d'abord la session depuis le tableau de bord.</div>
    }
    return <div className="page-centered">Session introuvable</div>
  }

  if (!session) {
    return <div className="page-centered">Session introuvable</div>
  }

  const date = format(new Date(session.startDatetime), "eeee d MMMM yyyy 'a' HH:mm", { locale: fr })

  return (
    <div className="card">
      <header className="page-header">
        <div>
          <h1>{session.title}</h1>
          <p>{session.location}</p>
          <p>{date}</p>
        </div>
        {isOrganizer && (
          <Link to={`/sessions/${session.id}/edit`} className="btn secondary">
            Modifier
          </Link>
        )}
      </header>

      <section>
        <h2>Participants</h2>
        <ul>
          <li key={`org-${session.organizer?.id ?? 'self'}`}>
            {session.organizer?.displayName ?? session.organizer?.username ?? 'Organisateur'} (organisateur)
          </li>
          {session.participants?.map((participant) => (
            <li key={participant.id}>
              {participant.user?.displayName ?? participant.user?.username} - {participant.statusInvitation}
            </li>
          )) ?? <li>Aucun participant</li>}
        </ul>
      </section>

      <section>
        <h2>Jeux prevus</h2>
        <ol>
          {session.games?.map((sessionGame) => (
            <li key={sessionGame.id}>
              {sessionGame.order}. {sessionGame.game?.name ?? "Jeu inconnu"}
            </li>
          )) ?? <li>Aucun jeu ajoute</li>}
        </ol>
      </section>

      <section>
        <h2>Resultats</h2>
        {session.games?.map((sessionGame) => (
          <div key={sessionGame.id}>
            <h3>{sessionGame.game?.name}</h3>
            <ul>
              {sessionGame.results?.map((result) => (
                <li key={result.id}>
                  #{result.playerRank} - {result.player?.displayName ?? result.player?.username}: {result.score} pts
                </li>
              )) ?? <li>Pas encore de resultats</li>}
            </ul>
          </div>
        )) ?? <p>Aucun resultat enregistre.</p>}
      </section>

      {isOrganizer && session.games && session.games.length > 0 && (
        <section className="card">
          <h2>Saisir des résultats</h2>
          <div className="form-actions" style={{ gap: "0.75rem", marginBottom: "0.75rem" }}>
            <label>
              <span>Jeu de la session</span>
              <select
                value={selectedSessionGameId}
                onChange={(e) => setSelectedSessionGameId(Number(e.target.value))}
                style={{ marginLeft: "0.5rem" }}
              >
                {session.games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.order}. {g.game?.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="session-grid">
            {participants.map((p) => (
              <div key={p.userId} className="card" style={{ padding: "1rem", gap: "0.5rem" }}>
                <strong>{p.user?.displayName ?? p.user?.username}</strong>
                <label>
                  <span>Score</span>
                  <input
                    type="number"
                    defaultValue={scores[p.userId]?.score ?? 0}
                    onChange={(e) => updateScore(p.userId, "score", Number(e.target.value))}
                  />
                </label>
                <label>
                  <span>Rang</span>
                  <input
                    type="number"
                    min={1}
                    defaultValue={scores[p.userId]?.playerRank ?? 0}
                    onChange={(e) => updateScore(p.userId, "playerRank", Number(e.target.value))}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="form-actions" style={{ marginTop: "1rem" }}>
            <button className="btn secondary" type="button" onClick={() => saveResults.mutate()} disabled={saveResults.isPending || !selectedSessionGameId || resultsPayload.length === 0}>
              Enregistrer les résultats
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
