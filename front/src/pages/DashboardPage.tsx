import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { fetchSessions, fetchDiscoverSessions } from "../api/sessions"
import { queryKeys } from "../store/queryKeys"
import { SessionCard } from "../components/session/SessionCard"
import { DiceLoader } from "../components/DiceLoader"
import logo from "../assets/logo.png"
import styles from "../styles/Dashboard.module.sass"

export const DashboardPage = () => {
  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: fetchSessions
  })
  const { data: discover } = useQuery({
    queryKey: ["sessions", "discover"],
    queryFn: fetchDiscoverSessions
  })

  if (isLoading) return <div className="page-centered"><DiceLoader /></div>

  const nextSession = sessions && sessions.length > 0 ? sessions[0] : null

  return (
    <div className={styles.dashboard}>
      <header className={styles.hero}>
        <img src={logo} alt="Friends Board Game Club" className={styles.logo} />
        <p>Organisez vos après-midis jeux et invitez vos amis.</p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Prochaine Partie</h2>
          {nextSession && (
            <Link to={`/sessions/${nextSession.id}`} className="btn accent">
              Voir les détails
            </Link>
          )}
        </div>

        {nextSession ? (
          <div className={styles.nextGameCard}>
            <div className={styles.nextGameContent}>
              <h3>{nextSession.games?.[0]?.game?.name || nextSession.title || "Session de jeu"}</h3>
              <p className={styles.date}>
                {new Date(nextSession.startDatetime).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <div className={styles.participants}>
                <span className={styles.label}>Participants:</span>
                <div className={styles.avatars}>
                  {nextSession.participants?.slice(0, 5).map((p, i) => (
                    <div
                      key={p.id}
                      className={styles.avatarPlaceholder}
                      style={{ background: ['#C0392B', '#2980B9', '#27AE60', '#F39C12', '#8E44AD'][i % 5] }}
                      title={p.user?.displayName || p.user?.username}
                    >
                      {(p.user?.displayName || p.user?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {(nextSession.participants?.length || 0) > 5 && (
                    <div className={styles.avatarPlaceholder} style={{ background: '#95A5A6' }}>
                      +{(nextSession.participants?.length || 0) - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <button className="btn">Je viens !</button>
              <button className="btn secondary">Pas dispo</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <p>Aucune partie prévue. C'est le moment d'en lancer une !</p>
            <Link className="btn" to="/sessions/new">
              Organiser une session
            </Link>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Sondages en cours</h2>
        <div className="card">
          <h3>On joue à quoi samedi ?</h3>
          <div className={styles.pollOption}>
            <span>Catan</span>
            <div className={styles.progressBar}><div style={{ width: '70%' }}></div></div>
          </div>
          <div className={styles.pollOption}>
            <span>Dixit</span>
            <div className={styles.progressBar}><div style={{ width: '30%' }}></div></div>
          </div>
          <div className={styles.pollOption}>
            <span>7 Wonders</span>
            <div className={styles.progressBar}><div style={{ width: '10%' }}></div></div>
          </div>
        </div>
      </section>

      {discover && discover.length > 0 && (
        <section className={styles.section}>
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

