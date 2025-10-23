import { useQuery } from "@tanstack/react-query"
import { useParams, Link } from "react-router-dom"
import { fetchSession } from "../api/sessions"
import { queryKeys } from "../store/queryKeys"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)

  const { data: session, isLoading } = useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: () => fetchSession(sessionId),
    enabled: Number.isFinite(sessionId)
  })

  if (!Number.isFinite(sessionId)) {
    return <div className="page-centered">Session invalide</div>
  }

  if (isLoading) {
    return <div className="page-centered">Chargement...</div>
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
        <Link to={`/sessions/${session.id}/edit`} className="btn secondary">
          Modifier
        </Link>
      </header>

      <section>
        <h2>Participants</h2>
        <ul>
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
    </div>
  )
}
