import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from 'react-i18next'
import { fetchHistoryStats } from "../api/stats"
import styles from "../styles/History.module.sass"

export const HistoryPage = () => {
  const { t, i18n } = useTranslation()
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['historyStats'],
    queryFn: fetchHistoryStats
  })

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('common.loading')}</div>
  
  if (isError || !stats) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('common.error')}</div>

  const { topUsers, recentHistory, sessionSummary, achievements } = stats

  // S'assurer qu'on a bien nos 3 tops même si vides
  const first = topUsers[0] || { name: "?", points: `0 ${t('history.pts')}`, avatar: "" }
  const second = topUsers[1] || { name: "?", points: `0 ${t('history.pts')}`, avatar: "" }
  const third = topUsers[2] || { name: "?", points: `0 ${t('history.pts')}`, avatar: "" }

  const MeepleIcon = ({ color, id }: { color: string, id: string }) => (
    <svg viewBox="0 0 512 512" fill={`url(#${id})`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#F7DB70', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#B18721', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ECF0F1', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#BDC3C7', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#7F8C8D', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFB380', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#CD7F32', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#D35400', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path 
        transform="translate(15.5, 0)"
        d="M241 68c-28.16 0-51 22.84-51 51s22.84 51 51 51 51-22.84 51-51-22.84-51-51-51zm-75 125c-20.43 0-38.38 12.38-45.72 31.09L74.88 338.41c-8.77 22.33 7.74 46.59 31.63 46.59h33.84v66c0 14.36 11.64 26 26 26h28.31c14.36 0 26-11.64 26-26v-66h39.69v66c0 14.36 11.64 26 26 26h28.31c14.36 0 26-11.64 26-26v-66h33.84c23.89 0 40.4-24.26 31.63-46.59l-45.4-114.32c-7.34-18.71-25.29-31.09-45.72-31.09H166z" 
      />
    </svg>
  )

  return (
    <div className={styles.historyContainer}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>{t('history.title')}</h1>
          <p>{t('history.subtitle')}</p>
        </div>
        <div className={styles.seasonBadge}>{t('history.season')}</div>
      </div>

      <div className={styles.mainGrid}>
        <div>
          <div className={styles.podiumSection}>
            <div className={`${styles.podiumItem} ${styles.second}`}>
              <div className={styles.avatarContainer}>
                <div className={styles.meepleContainer}>
                  <MeepleIcon color="#7F8C8D" id="silver-grad" />
                  <span className={`${styles.initial} ${styles.small}`}>
                    {(second.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.rank}>2</div>
              </div>
              <div className={styles.podiumCard}>
                <h3>{second.name}</h3>
                <p>{second.points}</p>
                <div style={{ color: "var(--secondary)" }}>★★</div>
              </div>
            </div>

            <div className={`${styles.podiumItem} ${styles.first}`}>
              <div className={styles.avatarContainer}>
                <div className={styles.meepleContainer}>
                  <MeepleIcon color="#B18721" id="gold-grad" />
                  <span className={styles.initial}>
                    {(first.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.rank}>1</div>
              </div>
              <div className={styles.podiumCard} style={{ background: "var(--card-bg)" }}>
                <h3>{first.name}</h3>
                <p>{first.points}</p>
                <div style={{ color: "var(--secondary)" }}>★★★</div>
              </div>
            </div>

            <div className={`${styles.podiumItem} ${styles.third}`}>
              <div className={styles.avatarContainer}>
                <div className={styles.meepleContainer}>
                  <MeepleIcon color="#D35400" id="bronze-grad" />
                  <span className={`${styles.initial} ${styles.small}`}>
                    {(third.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.rank}>3</div>
              </div>
              <div className={styles.podiumCard}>
                <h3>{third.name}</h3>
                <p>{third.points}</p>
                <div style={{ color: "var(--secondary)" }}>★</div>
              </div>
            </div>
          </div>

          <div className={styles.recentHistory}>
            <div className={styles.sectionHeader}>
              <h2>{t('history.recentHistory')}</h2>
              <Link to="/logs" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{t('history.viewAll')}</Link>
            </div>
            
            <div className={styles.historyList}>
              {recentHistory.length === 0 && <p>{t('history.noHistory')}</p>}
              {recentHistory.map((item) => (
                <div key={item.id} className={styles.historyItem}>
                  <div className={styles.gameInfo}>
                    <img src={item.cover} alt={item.game} className={styles.gameIcon} />
                    <div>
                      <h4>{item.game}</h4>
                      <span>📅 {new Date(item.date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>👥 {item.players} {t('history.players')}</span>
                    </div>
                  </div>
                  <div className={styles.winnerBadge}>
                    <span>{t('history.winner')}</span>
                    {item.winner}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.summaryCard}>
            <div className={styles.patternBackground}></div>
            <h2>{t('history.summary')}</h2>
            
            <div className={styles.statRow}>
              <span>{t('history.totalSessions')}</span>
              <strong>{sessionSummary.totalSessions}</strong>
            </div>
            
            <div className={styles.statRow}>
              <span>{t('history.winRatio')}</span>
              <strong>{sessionSummary.winRatio}</strong>
            </div>
            
            <div className={styles.statRow}>
              <span>{t('history.hoursPlayed')}</span>
              <strong>{sessionSummary.hoursPlayed}</strong>
            </div>

            <div className={styles.quote}>
              {t('history.winningStreak', { name: "Felix", count: 5 })}
            </div>
          </div>

          <div className={styles.achievements}>
            <h2>🏆 {t('nav.history')}</h2>
            <div className={styles.achievementsGrid}>
              {achievements.map((ach) => (
                <div key={ach.id} className={`${styles.achievementCard} ${ach.locked ? styles.locked : ''}`}>
                  <div className={styles.icon}>{ach.icon}</div>
                  <h5>{t(`history.achievements.${ach.id}.title`)}</h5>
                  <p>{t(`history.achievements.${ach.id}.desc`)}</p>
                </div>
              ))}
            </div>
            <button className="btn secondary" style={{ width: '100%', marginTop: '1.5rem' }}>{t('history.viewTrophies')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
