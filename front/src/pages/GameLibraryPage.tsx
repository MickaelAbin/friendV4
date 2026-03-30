import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { listGames, saveGame, searchGames, deleteGame } from "../api/games"
import { queryKeys } from "../store/queryKeys"
import { DiceLoader } from "../components/DiceLoader"
import { ConfirmModal } from "../components/ConfirmModal"
import styles from "../styles/GameLibrary.module.sass"

export const GameLibraryPage = () => {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<any>>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [manualName, setManualName] = useState("")
  const [manualMin, setManualMin] = useState<string>("")
  const [manualMax, setManualMax] = useState<string>("")
  const [manualDur, setManualDur] = useState<string>("")
  const [gameToDelete, setGameToDelete] = useState<{ id: number; name: string } | null>(null)

  // Filters
  const [filterPlayers, setFilterPlayers] = useState<string>("")
  const [filterDuration, setFilterDuration] = useState<string>("")
  const { t } = useTranslation()

  const queryClient = useQueryClient()

  const { data: games, isLoading } = useQuery({
    queryKey: queryKeys.games,
    queryFn: listGames
  })

  const saveMutation = useMutation({
    mutationFn: saveGame,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games })
      setSearchResults([])
      setHasSearched(false)
      setQuery("")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGame,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games })
    }
  })

  const handleDelete = (id: number, name: string) => {
    setGameToDelete({ id, name })
  }

  const confirmDelete = () => {
    if (gameToDelete) {
      deleteMutation.mutate(gameToDelete.id, {
        onSuccess: () => setGameToDelete(null)
      })
    }
  }

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    if (query.trim().length < 2) return
    const results = await searchGames(query.trim())
    setSearchResults(results)
    setHasSearched(true)
  }

  const handleManualAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = manualName.trim()
    if (name.length < 2) return
    await saveMutation.mutateAsync({
      name,
      minPlayers: manualMin ? Number(manualMin) : null,
      maxPlayers: manualMax ? Number(manualMax) : null,
      averageDuration: manualDur ? Number(manualDur) : null
    })
    setManualName("")
    setManualMin("")
    setManualMax("")
    setManualDur("")
  }

  const filteredGames = useMemo(() => {
    if (!games) return []
    return games.filter(game => {
      if (filterPlayers) {
        const p = Number(filterPlayers)
        if (game.minPlayers && game.minPlayers > p) return false
        if (game.maxPlayers && game.maxPlayers < p) return false
      }
      if (filterDuration) {
        const d = Number(filterDuration)
        if (game.averageDuration && game.averageDuration > d) return false
      }
      return true
    })
  }, [games, filterPlayers, filterDuration])

  if (isLoading) return <div className="page-centered"><DiceLoader /></div>

  return (
    <>
      <ConfirmModal
        isOpen={gameToDelete !== null}
        title={t('library.deletePrompt')}
        message={gameToDelete ? t('library.deleteConfirm', { name: gameToDelete.name }) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setGameToDelete(null)}
        isPending={deleteMutation.isPending}
      />
      <div className={styles.library}>
        <header className={styles.header}>
          <h1>{t('library.title')}</h1>
          <div className={styles.searchSection}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flex: 1 }}>
              <input
                type="search"
                value={query}
                placeholder={t('library.searchPlaceholder')}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="btn secondary" type="submit">
                {t('common.search')}
              </button>
            </form>
          </div>
        </header>

        {hasSearched && (
          <section>
            <h2>{t('library.searchResults')}</h2>
            {searchResults.length === 0 ? (
              <p>{t('library.noResults')}</p>
            ) : (
              <div className={styles.grid}>
                {searchResults.map((game) => (
                  <div className={styles.gameCard} key={game.externalId ?? game.id}>
                    {game.thumbnailUrl && (
                      <img src={game.thumbnailUrl} alt={game.name} />
                    )}
                    <div className={styles.gameContent}>
                      <h3>{game.name}</h3>
                      <div className={styles.meta}>
                        <span>{game.yearPublished}</span>
                      </div>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        onClick={() => saveMutation.mutate({
                          name: game.name,
                          externalId: game.externalId ?? game.id?.toString?.(),
                          apiSource: game.apiSource,
                          minPlayers: game.minPlayers ?? null,
                          maxPlayers: game.maxPlayers ?? null,
                          averageDuration: game.averageDuration ?? null,
                          imageUrl: game.thumbnailUrl ?? null,
                          description: game.description ?? null
                        })}
                        disabled={saveMutation.isPending}
                      >
                        {t('library.addToCollection')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <div className={styles.header} style={{ marginBottom: '1rem' }}>
            <h2>{t('library.myGames', { count: filteredGames.length })}</h2>
            <div className={styles.filters}>
              <select value={filterPlayers} onChange={e => setFilterPlayers(e.target.value)}>
                <option value="">{t('library.filterPlayers')}</option>
                <option value="2">{t('library.playersCount', { count: 2 })}</option>
                <option value="3">{t('library.playersCount', { count: 3 })}</option>
                <option value="4">{t('library.playersCount', { count: 4 })}</option>
                <option value="5">{t('library.playersCount', { count: 5 })}</option>
                <option value="6">{t('library.playersCount', { count: 6 })}+</option>
              </select>
              <select value={filterDuration} onChange={e => setFilterDuration(e.target.value)}>
                <option value="">{t('library.filterDuration')}</option>
                <option value="30">{t('library.durationFormat', { count: 30 })}</option>
                <option value="60">{t('library.durationFormat', { count: 60 })} (1h)</option>
                <option value="90">{t('library.durationFormat', { count: 90 })} (1h30)</option>
                <option value="120">{t('library.durationFormat', { count: 120 })} (2h)</option>
                <option value="180">{t('library.durationFormat', { count: 180 })}+ (3h+)</option>
              </select>
            </div>
          </div>

          <div className={styles.grid}>
            {filteredGames.map((game) => (
              <div className={styles.gameCard} key={game.id}>
                <Link to={`/games/${game.id}`} className={styles.cardLink}>
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} />
                  ) : (
                    <div style={{ height: 200, background: '#ECF0F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BDC3C7' }}>
                      🎲
                    </div>
                  )}
                  <div className={styles.gameContent}>
                    <h3>{game.name}</h3>
                    <div className={styles.meta}>
                      <span>👥 {game.minPlayers ?? "?"}-{game.maxPlayers ?? "?"}</span>
                      <span>⏱️ {game.averageDuration ? t('library.durationFormat', { count: game.averageDuration }) : "?"}</span>
                    </div>
                  </div>
                </Link>
                <div style={{ padding: '0 1rem 1rem' }}>
                  <button
                    type="button"
                    onClick={() => handleDelete(game.id, game.name)}
                    disabled={deleteMutation.isPending}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px dashed rgba(145,53,41,0.4)',
                      color: 'var(--accent)',
                      borderRadius: '8px',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    🗑️ {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
            {filteredGames.length === 0 && games && games.length > 0 && (
              <p>{t('library.noGamesFilter')}</p>
            )}
            {games && games.length === 0 && (
              <p>{t('library.emptyLibrary')}</p>
            )}
          </div>
        </section>

        <section className="card">
          <h2>{t('library.manualAdd')}</h2>
          <form onSubmit={handleManualAdd} className={styles.addForm}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>{t('library.gameName')}</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>{t('library.minPlayers')}</label>
              <input
                type="number"
                min={1}
                value={manualMin}
                onChange={(e) => setManualMin(e.target.value)}
                style={{ width: '80px' }}
              />
            </div>
            <div className={styles.field}>
              <label>{t('library.maxPlayers')}</label>
              <input
                type="number"
                min={1}
                value={manualMax}
                onChange={(e) => setManualMax(e.target.value)}
                style={{ width: '80px' }}
              />
            </div>
            <div className={styles.field}>
              <label>{t('library.duration')}</label>
              <input
                type="number"
                min={1}
                value={manualDur}
                onChange={(e) => setManualDur(e.target.value)}
                style={{ width: '100px' }}
              />
            </div>
            <button className="btn" type="submit" disabled={saveMutation.isPending}>{t('common.add')}</button>
          </form>
        </section>
      </div>
    </>
  )
}


