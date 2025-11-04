import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listGames, saveGame, searchGames, fetchGameThing } from "../api/games"
import { queryKeys } from "../store/queryKeys"

export const GameLibraryPage = () => {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<any>>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [manualName, setManualName] = useState("")
  const [manualMin, setManualMin] = useState<string>("")
  const [manualMax, setManualMax] = useState<string>("")
  const [manualDur, setManualDur] = useState<string>("")
  const queryClient = useQueryClient()

  const { data: games } = useQuery({
    queryKey: queryKeys.games,
    queryFn: listGames
  })

  const saveMutation = useMutation({
    mutationFn: saveGame,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.games })
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

  return (
    <div className="card">
      <h1>Ludotheque</h1>
      <form onSubmit={handleSearch} className="form-actions" style={{ marginBottom: "1.5rem" }}>
        <input
          type="search"
          value={query}
          placeholder="Rechercher un jeu (BoardGameGeek)"
          onChange={(event) => setQuery(event.target.value)}
          style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(15, 23, 42, 0.15)" }}
        />
        <button className="btn secondary" type="submit">
          Rechercher
        </button>
      </form>

      {hasSearched && searchResults.length === 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <p>Aucun résultat trouvé.</p>
        </div>
      )}

      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Ajouter un jeu manuellement</h2>
        <form onSubmit={handleManualAdd} className="form-actions" style={{ gap: "0.5rem", flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nom du jeu"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            required
            style={{ flex: 1, minWidth: 220, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(15, 23, 42, 0.15)" }}
          />
          <input
            type="number"
            min={1}
            placeholder="Min joueurs"
            value={manualMin}
            onChange={(e) => setManualMin(e.target.value)}
            style={{ width: 130, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(15, 23, 42, 0.15)" }}
          />
          <input
            type="number"
            min={1}
            placeholder="Max joueurs"
            value={manualMax}
            onChange={(e) => setManualMax(e.target.value)}
            style={{ width: 130, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(15, 23, 42, 0.15)" }}
          />
          <input
            type="number"
            min={1}
            placeholder="Durée (min)"
            value={manualDur}
            onChange={(e) => setManualDur(e.target.value)}
            style={{ width: 130, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(15, 23, 42, 0.15)" }}
          />
          <button className="btn" type="submit" disabled={saveMutation.isPending}>Ajouter</button>
        </form>
      </section>

      {searchResults.length > 0 && (
        <section>
          <h2>Resultats externes</h2>
          <div className="session-grid">
            {searchResults.map((game) => (
              <div className="card" key={game.externalId ?? game.id}>
                {game.thumbnailUrl && (
                  <img src={game.thumbnailUrl} alt={game.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '0.5rem' }} />
                )}
                <h3>{game.name}</h3>
                {game.yearPublished != null && (
                  <p>Année: {game.yearPublished}</p>
                )}
                {(game.minPlayers != null || game.maxPlayers != null || game.averageDuration != null) && (
                  <p>
                    {game.minPlayers ?? ''}{game.minPlayers != null || game.maxPlayers != null ? ' - ' : ''}{game.maxPlayers ?? ''}{(game.minPlayers != null || game.maxPlayers != null) && ' joueurs'}
                    {game.averageDuration != null && ` - ${game.averageDuration} min`}
                  </p>
                )}
                <button
                  type="button"
                  className="btn secondary"
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
                  Ajouter a ma ludotheque
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Jeux enregistres</h2>
        <div className="session-grid">
          {games?.map((game) => (
            <div className="card" key={game.id}>
              {game.imageUrl && (
                <img src={game.imageUrl} alt={game.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '0.5rem' }} />
              )}
              <h3>{game.name}</h3>
              <p>
                {game.minPlayers ?? "?"} - {game.maxPlayers ?? "?"} joueurs
              </p>
              {game.averageDuration && <p>{game.averageDuration} minutes</p>}
            </div>
          )) ?? <p>Votre ludotheque est vide.</p>}
        </div>
      </section>
    </div>
  )
}

