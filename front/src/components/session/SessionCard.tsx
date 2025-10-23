import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Link } from "react-router-dom"
import type { Session } from "../../api/types"

interface SessionCardProps {
  session: Session
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const date = format(new Date(session.startDatetime), "eeee d MMMM yyyy 'a' HH:mm", { locale: fr })
  const attendeeCount = session.participants?.length ?? 0
  const gamesCount = session.games?.length ?? 0

  return (
    <article className="card session-card">
      <header>
        <h3>{session.title}</h3>
        <span className={`status status-${session.status.toLowerCase()}`}>{session.status}</span>
      </header>
      <p className="session-meta">{date}</p>
      <p className="session-meta">{session.location}</p>
      <div className="session-stats">
        <span>{attendeeCount} participant(s)</span>
        <span>{gamesCount} jeu(x)</span>
      </div>
      <Link className="btn secondary" to={`/sessions/${session.id}`}>
        Voir la session
      </Link>
    </article>
  )
}
