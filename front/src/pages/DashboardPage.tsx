import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { fetchSessions, fetchDiscoverSessions } from "../api/sessions"
import { queryKeys } from "../store/queryKeys"
import { SessionCard } from "../components/session/SessionCard"

export const DashboardPage = () => {
  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: fetchSessions
  })
  const { data: discover } = useQuery({
    queryKey: ["sessions", "discover"],
    queryFn: fetchDiscoverSessions
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Mes sessions</h1>
          <p>Organisez vos apres-midis de jeux et invitez vos amis.</p>
        </div>
        <Link className="btn secondary" to="/sessions/new">
          Nouvelle session
        </Link>
      </div>
      {isLoading ? (
        <div className="page-centered">Chargement des sessions...</div>
      ) : sessions && sessions.length > 0 ? (
        <div className="session-grid">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <div className="page-centered">
          <div>
            <p>Vous n'avez encore aucune session.</p>
            <Link className="btn secondary" to="/sessions/new">
              Creer la premiere
            </Link>
          </div>
        </div>
      )}

      {discover && discover.length > 0 && (
        <section>
          <h2>Sessions disponibles</h2>
          <div className="session-grid">
            {discover.map((session) => (
              <SessionCard key={`d-${session.id}`} session={session} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
