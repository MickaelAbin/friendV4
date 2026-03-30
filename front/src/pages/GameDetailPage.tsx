import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from "react-i18next"
import { useQuery } from '@tanstack/react-query'
import { fetchGameById, fetchGameThing } from '../api/games'
import { DiceLoader } from '../components/DiceLoader'
import styles from '../styles/GameDetailPage.module.sass'

export const GameDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const gameId = Number(id)

  const { data: game, isLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => fetchGameById(gameId),
    enabled: !!gameId
  })

  // Enrichissement BGG si externalId disponible
  const { data: bggDetails, isLoading: bggLoading } = useQuery({
    queryKey: ['bggThing', game?.externalId],
    queryFn: () => fetchGameThing(game!.externalId!),
    enabled: !!game?.externalId
  })

  if (isLoading) return <div className="page-centered"><DiceLoader /></div>
  if (!game) return <div style={{ padding: '3rem', textAlign: 'center' }}>{t('gameDetail.notFound')}</div>

  const cover = game.imageUrl || bggDetails?.thumbnailUrl
  const minP = game.minPlayers ?? bggDetails?.minPlayers
  const maxP = game.maxPlayers ?? bggDetails?.maxPlayers
  const duration = game.averageDuration ?? bggDetails?.averageDuration

  return (
    <div className={styles.container}>
      {/* Bouton retour */}
      <button className={styles.backBtn} onClick={() => navigate('/games')}>
        {t('gameDetail.back')}
      </button>

      <div className={styles.hero}>
        {/* Image */}
        <div className={styles.imageWrapper}>
          {cover ? (
            <img src={cover} alt={game.name} className={styles.cover} />
          ) : (
            <div className={styles.noImage}>🎲</div>
          )}
          {game.apiSource === 'bgg' || game.apiSource === 'bgg-search' ? (
            <div className={styles.sourceBadge}>Board Game Geek</div>
          ) : null}
        </div>

        {/* Infos principales */}
        <div className={styles.info}>
          <h1>{game.name}</h1>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statIcon}>👥</span>
              <div>
                <div className={styles.statLabel}>{t('gameDetail.players')}</div>
                <div className={styles.statValue}>
                  {minP && maxP ? `${minP} – ${maxP}` : minP ?? maxP ?? '–'}
                </div>
              </div>
            </div>

            <div className={styles.stat}>
              <span className={styles.statIcon}>⏱️</span>
              <div>
                <div className={styles.statLabel}>{t('gameDetail.avgDuration')}</div>
                <div className={styles.statValue}>
                  {duration ? `${duration} min` : '–'}
                </div>
              </div>
            </div>

            {game.externalId && (
              <div className={styles.stat}>
                <span className={styles.statIcon}>🔗</span>
                <div>
                  <div className={styles.statLabel}>{t('gameDetail.source')}</div>
                  <div className={styles.statValue}>BGG #{game.externalId}</div>
                </div>
              </div>
            )}
          </div>

          {/* Badge BGG enrichi */}
          {bggLoading && game.externalId && !game.description && (
            <p style={{ color: 'var(--teal)', fontSize: '0.85rem' }}>{t('gameDetail.loadingBGG')}</p>
          )}

          {/* Description (Priorité à la BDD locale, sinon BGG) */}
          {(game.description || bggDetails?.description) && (
            <div className={styles.description}>
              <h2>{t('gameDetail.description')}</h2>
              <p>{game.description || bggDetails?.description}</p>
            </div>
          )}

          <div className={styles.tags}>
            {minP !== null && minP !== undefined && (
              <span className={styles.tag}>
                {minP === 1 ? t('gameDetail.soloPossible') : t('gameDetail.minPlayers', { count: minP })}
              </span>
            )}
            {maxP !== null && maxP !== undefined && maxP >= 6 && (
              <span className={styles.tag}>{t('gameDetail.largeGroups')}</span>
            )}
            {duration !== null && duration !== undefined && duration <= 30 && (
              <span className={styles.tag}>{t('gameDetail.shortGame')}</span>
            )}
            {duration !== null && duration !== undefined && duration >= 120 && (
              <span className={styles.tag}>{t('gameDetail.epicSession')}</span>
            )}
          </div>

          {/* Lien BGG externe */}
          {game.externalId && (
            <a
              href={`https://boardgamegeek.com/boardgame/${game.externalId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bggLink}
            >
              {t('gameDetail.viewOnBGG')}
            </a>
          )}
        </div>
      </div>

      {/* Carte "Ajouter à une session" */}
      <div className={styles.actionsCard}>
        <div className={styles.actionItem}>
          <span>📅</span>
          <div>
            <strong>{t('gameDetail.planTitle')}</strong>
            <p>{t('gameDetail.planSubtitle')}</p>
          </div>
          <button className={styles.actionBtn} onClick={() => navigate('/sessions/new')}>
            {t('gameDetail.organize')}
          </button>
        </div>
      </div>
    </div>
  )
}
