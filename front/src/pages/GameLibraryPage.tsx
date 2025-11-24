import { useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listGames, saveGame, searchGames } from "../api/games"
import { queryKeys } from "../store/queryKeys"
import { DiceLoader } from "../components/DiceLoader"
import styles from "../styles/GameLibrary.module.sass"

export const GameLibraryPage = () => {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<any>>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [manualName, setManualName] = useState("")
  const [manualMin, setManualMin] = useState<string>("")
  const [manualMax, setManualMax] = useState<string>("")
  const [manualDur, setManualDur] = useState<string>("")

  // Filters
  const [filterPlayers, setFilterPlayers] = useState<string>("")
  const [filterDuration, setFilterDuration] = useState<string>("")

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
    <div className={styles.library}>
      <header className={styles.header}>
        <h1>Ma Ludothèque</h1>
        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flex: 1 }}>
            <input
              type="search"
              value={query}
              placeholder="Rechercher un jeu sur BGG..."
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="btn secondary" type="submit">
              Rechercher
            </button>
          </form>
        </div>
      </header>

      {hasSearched && (
        <section>
          <h2>Résultats de la recherche</h2>
          {searchResults.length === 0 ? (
            <p>Aucun résultat trouvé.</p>
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
                        imageUrl: game.thumbnailUrl ?? null
                      })}
                      disabled={saveMutation.isPending}
                    >
                      Ajouter à ma collection
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
          <h2>Mes Jeux ({filteredGames.length})</h2>
          <div className={styles.filters}>
            <select value={filterPlayers} onChange={e => setFilterPlayers(e.target.value)}>
              <option value="">Nombre de joueurs</option>
              <option value="2">2 joueurs</option>
              <option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option>
              <option value="5">5 joueurs</option>
              <option value="6">6+ joueurs</option>
            </select>
            <select value={filterDuration} onChange={e => setFilterDuration(e.target.value)}>
              <option value="">Durée max</option>
              <option value="30">30 min</option>
              <option value="60">1 heure</option>
              <option value="90">1h30</option>
              <option value="120">2 heures</option>
              <option value="180">3 heures+</option>
            </select>
          </div>
        </div>

        <div className={styles.grid}>
          {filteredGames.map((game) => (
            <div className={styles.gameCard} key={game.id}>
              {game.imageUrl ? (
                <img src={game.imageUrl} alt={game.name} />
              ) : (
                <div style={{ height: 200, background: '#ECF0F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BDC3C7' }}>
                  Pas d'image
                </div>
              )}
              <div className={styles.gameContent}>
                <h3>{game.name}</h3>
                <div className={styles.meta}>
                  <span>👥 {game.minPlayers ?? "?"}-{game.maxPlayers ?? "?"}</span>
                  <span>⏱️ {game.averageDuration ? `${game.averageDuration} min` : "?"}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredGames.length === 0 && games && games.length > 0 && (
            <p>Aucun jeu ne correspond aux filtres.</p>
          )}
          {games && games.length === 0 && (
            <p>Votre ludothèque est vide. Ajoutez des jeux via la recherche !</p>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Ajouter un jeu manuellement</h2>
        <form onSubmit={handleManualAdd} className={styles.addForm}>
          <div className={styles.field} style={{ flex: 1 }}>
            <label>Nom du jeu</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Min Joueurs</label>
            <input
              type="number"
              min={1}
              value={manualMin}
              onChange={(e) => setManualMin(e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
          <div className={styles.field}>
            <label>Max Joueurs</label>
            <input
              type="number"
              min={1}
              value={manualMax}
              onChange={(e) => setManualMax(e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
          <div className={styles.field}>
            <label>Durée (min)</label>
            <input
              type="number"
              min={1}
              value={manualDur}
              onChange={(e) => setManualDur(e.target.value)}
              style={{ width: '100px' }}
            />
          </div>
          <button className="btn" type="submit" disabled={saveMutation.isPending}>Ajouter</button>
        </form>
      </section>
    </div>
  )
}


