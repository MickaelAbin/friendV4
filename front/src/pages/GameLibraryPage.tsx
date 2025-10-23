import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listGames, saveGame, searchGames } from "../api/games"
import { queryKeys } from "../store/queryKeys"

export const GameLibraryPage = () => {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<any>>([])
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
  }

  return (
    <div className="card">
      <h1>Ludotheque</h1>
      <form onSubmit={handleSearch} className="form-actions" style={{ marginBottom: "1.5rem" }}>
        <input
          type="search"
          value={query}
          placeholder="Rechercher un jeu (BoardGameAtlas)"
          onChange={(event) => setQuery(event.target.value)}
          style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(15, 23, 42, 0.15)" }}
        />
        <button className="btn secondary" type="submit">
          Rechercher
        </button>
      </form>

      {searchResults.length > 0 && (
        <section>
          <h2>Resultats externes</h2>
          <div className="session-grid">
            {searchResults.map((game) => (
              <div className="card" key={game.externalId ?? game.id}>
                <h3>{game.name}</h3>
                <p>
                  {game.minPlayers ?? "?"} - {game.maxPlayers ?? "?"} joueurs - {game.averageDuration ?? "?"} min
                </p>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => saveMutation.mutate(game)}
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

