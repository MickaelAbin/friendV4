import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import { prisma } from '../utils/prisma.js'
import { env } from '../config/env.js'

// Basic compliance helpers for BGG XML API usage
// - Respect ~5s between external calls
// - Add a small cache to avoid repeated queries
let lastExternalCall = 0
const MIN_INTERVAL_MS = Number.isFinite(env.BGG_MIN_INTERVAL_MS ?? NaN) ? (env.BGG_MIN_INTERVAL_MS as number) : 5000
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes
const searchCache = new Map<string, {
  at: number; items: Array<{
    name: string
    externalId: string
    apiSource: string
    minPlayers: number | null
    maxPlayers: number | null
    averageDuration: number | null
    thumbnailUrl?: string
    yearPublished?: number | null
  }>
}>()

const waitBetweenCalls = async () => {
  const now = Date.now()
  const delta = now - lastExternalCall
  if (delta < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - delta))
  }
}

export class GameService {
  static async listLocal() {
    return prisma.game.findMany({
      orderBy: { name: 'asc' }
    })
  }

  // Fast path: single XML call to BGG search, returns minimal info (no min/max/duration)
  static async searchExternalFast(query: string) {
    const BGG_SEARCH_V2 = 'https://boardgamegeek.com/xmlapi2/search'
    const GEEKDO_SEARCH_V2 = 'https://api.geekdo.com/xmlapi2/search'

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

    const fetchXML = async (url: string, params: Record<string, any>) => {
      await waitBetweenCalls()
      const res = await axios.get(url, {
        params,
        timeout: 12000,
        headers: {
          Accept: 'application/xml',
          'User-Agent': UA,
          ...(env.BGG_API_TOKEN ? { Authorization: `Bearer ${env.BGG_API_TOKEN}` } : {}),
          ...(env.BGG_COOKIE ? { Cookie: env.BGG_COOKIE } : {})
        },
        validateStatus: () => true
      })
      lastExternalCall = Date.now()
      if (res.status !== 200 || typeof res.data !== 'string') return null
      try { return parser.parse(res.data) } catch { return null }
    }

    const key = `fast:${query.trim().toLowerCase()}`
    const cached = searchCache.get(key)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.items

    let xml = await fetchXML(BGG_SEARCH_V2, { query, type: 'boardgame' })
    if (!xml) xml = await fetchXML(GEEKDO_SEARCH_V2, { query, type: 'boardgame' })
    const items = xml?.items?.item ?? []
    const list = Array.isArray(items) ? items : [items]
    const results = list.slice(0, 25).map((it: any) => ({
      name: typeof it.name === 'object' ? (it.name?.['@_value'] ?? '') : '',
      externalId: String(it['@_id']),
      apiSource: 'bgg-search',
      minPlayers: null,
      maxPlayers: null,
      averageDuration: null,
      yearPublished: it.yearpublished && typeof it.yearpublished['@_value'] !== 'undefined'
        ? (Number(it.yearpublished['@_value']) || null)
        : null
    }))
    if (results.length > 0) searchCache.set(key, { at: Date.now(), items: results })
    return results
  }

  static async searchExternal(query: string) {
    const key = query.trim().toLowerCase()
    const cached = searchCache.get(key)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return cached.items
    }
    // BoardGameGeek XML API v2 only
    const BGG_SEARCH_V2 = 'https://boardgamegeek.com/xmlapi2/search'
    const BGG_THING_V2 = 'https://boardgamegeek.com/xmlapi2/thing'
    // Alternative host that sert the same XML API
    const GEEKDO_SEARCH_V2 = 'https://api.geekdo.com/xmlapi2/search'
    const GEEKDO_THING_V2 = 'https://api.geekdo.com/xmlapi2/thing'

    try {
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
      // Simple retry helper to handle 202 "queued" responses and CDN caching
      const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      const fetchXML = async (url: string, params: Record<string, any>) => {
        const maxAttempts = 4
        for (let i = 0; i < maxAttempts; i++) {
          await waitBetweenCalls()
          const res = await axios.get(url, {
            params,
            timeout: 15000,
            headers: {
              Accept: 'application/xml',
              'User-Agent': UA,
              ...(env.BGG_API_TOKEN ? { Authorization: `Bearer ${env.BGG_API_TOKEN}` } : {}),
              ...(env.BGG_COOKIE ? { Cookie: env.BGG_COOKIE } : {})
            },
            // accept 200/202 without throwing; we'll handle below
            validateStatus: () => true
          })
          lastExternalCall = Date.now()
          if (res.status === 200 && typeof res.data === 'string') {
            try {
              const parsed = parser.parse(res.data)
              if (parsed && parsed.items) return parsed
            } catch { }
          }
          if (res.status === 401 || res.status === 403) {
            console.warn('BGG API unauthorized/forbidden. Configure BGG_API_TOKEN or check permissions.')
            return null
          }
          // BGG can return 202 while it prepares the response; wait then retry
          await new Promise((r) => setTimeout(r, 900 + i * 400))
        }
        return null
      }

      // No HTML fallback: API only

      // 1) Search for boardgames by name (API v2) — expansions retirées pour limiter les faux négatifs
      let searchJson1 = await fetchXML(BGG_SEARCH_V2, { query, type: 'boardgame' })
      if (!searchJson1) {
        searchJson1 = await fetchXML(GEEKDO_SEARCH_V2, { query, type: 'boardgame' })
      }
      let items = searchJson1?.items?.item ?? []
      let list = Array.isArray(items) ? items : [items]
      let ids: number[] = list
        .slice(0, 25) // limit to 25 to keep it light
        .map((it: any) => Number(it['@_id']))
        .filter((n: number) => Number.isFinite(n))

      // If still nothing, try exact match to dodge odd search quirks
      if (ids.length === 0) {
        let searchJson2 = await fetchXML(BGG_SEARCH_V2, { query, type: 'boardgame', exact: 1 })
        if (!searchJson2) {
          searchJson2 = await fetchXML(GEEKDO_SEARCH_V2, { query, type: 'boardgame', exact: 1 })
        }
        items = searchJson2?.items?.item ?? []
        list = Array.isArray(items) ? items : [items]
        ids = list
          .slice(0, 25)
          .map((it: any) => Number(it['@_id']))
          .filter((n: number) => Number.isFinite(n))
      }

      // API only: if nothing found, return empty now
      if (ids.length === 0) return []

      // 2) Fetch details for min/max players and playtime in one call
      let thingJson = await fetchXML(BGG_THING_V2, { id: ids.join(','), stats: 1 })
      if (!thingJson) {
        thingJson = await fetchXML(GEEKDO_THING_V2, { id: ids.join(','), stats: 1 })
      }
      if (!thingJson) return []
      const things = thingJson?.items?.item ?? []
      const arr = Array.isArray(things) ? things : [things]

      const results = arr.map((t: any) => {
        const nameField = Array.isArray(t.name) ? t.name.find((n: any) => n['@_type'] === 'primary') ?? t.name[0] : t.name
        const name = typeof nameField === 'object' ? nameField?.['@_value'] : String(nameField ?? '')
        const minPlayers = t.minplayers ? Number(t.minplayers['@_value']) : null
        const maxPlayers = t.maxplayers ? Number(t.maxplayers['@_value']) : null
        const playtime = t.playingtime ? Number(t.playingtime['@_value']) : null
        return {
          name: name || 'Untitled',
          externalId: String(t['@_id']),
          apiSource: 'bgg',
          minPlayers: Number.isFinite(minPlayers) ? minPlayers : null,
          maxPlayers: Number.isFinite(maxPlayers) ? maxPlayers : null,
          averageDuration: Number.isFinite(playtime) ? playtime : null,
          thumbnailUrl: typeof (t as any).thumbnail === 'string' ? (t as any).thumbnail : (typeof (t as any).image === 'string' ? (t as any).image : undefined)
        }
      })

      // cache results
      if (results.length > 0) {
        searchCache.set(key, { at: Date.now(), items: results })
      }
      if (env.NODE_ENV !== 'production') {
        console.debug(`[BGG] search '${query}' -> ids=${ids.length}, things=${results.length}`)
      }
      return results
    } catch (_err) {
      // External API unavailable or parsing failed: return empty list gracefully
      return []
    }
  }

  // Fetch BGG details (min/max/duration/image) for a single externalId via XML v2 thing
  static async fetchBggThing(externalId: string) {
    const BGG_THING_V2 = 'https://boardgamegeek.com/xmlapi2/thing'
    const GEEKDO_THING_V2 = 'https://api.geekdo.com/xmlapi2/thing'
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

    const fetchXML = async (url: string) => {
      await waitBetweenCalls()
      const res = await axios.get(url, {
        params: { id: externalId, stats: 1 },
        timeout: 15000,
        headers: {
          Accept: 'application/xml',
          'User-Agent': UA,
          ...(env.BGG_API_TOKEN ? { Authorization: `Bearer ${env.BGG_API_TOKEN}` } : {}),
          ...(env.BGG_COOKIE ? { Cookie: env.BGG_COOKIE } : {})
        },
        validateStatus: () => true
      })
      lastExternalCall = Date.now()
      if (res.status !== 200 || typeof res.data !== 'string') return null
      try { return parser.parse(res.data) } catch { return null }
    }

    let xml = await fetchXML(BGG_THING_V2)
    if (!xml) xml = await fetchXML(GEEKDO_THING_V2)
    const item = Array.isArray(xml?.items?.item) ? xml?.items?.item?.[0] : xml?.items?.item
    if (!item) return null
    const nameField = Array.isArray(item.name) ? item.name.find((n: any) => n['@_type'] === 'primary') ?? item.name[0] : item.name
    const name = typeof nameField === 'object' ? nameField?.['@_value'] : String(nameField ?? '')
    const minPlayers = item.minplayers ? Number(item.minplayers['@_value']) : null
    const maxPlayers = item.maxplayers ? Number(item.maxplayers['@_value']) : null
    const playtime = item.playingtime ? Number(item.playingtime['@_value']) : null
    const thumbnailUrl = typeof (item as any).thumbnail === 'string'
      ? (item as any).thumbnail
      : (typeof (item as any).image === 'string' ? (item as any).image : undefined)
    return {
      name,
      minPlayers: Number.isFinite(minPlayers) ? minPlayers : null,
      maxPlayers: Number.isFinite(maxPlayers) ? maxPlayers : null,
      averageDuration: Number.isFinite(playtime) ? playtime : null,
      thumbnailUrl
    }
  }

  static async saveGame(data: {
    name: string
    externalId?: string
    apiSource?: string
    averageDuration?: number | null
    minPlayers?: number | null
    maxPlayers?: number | null
    imageUrl?: string | null
  }) {
    if (data.externalId) {
      return prisma.game.upsert({
        where: { externalId: data.externalId },
        create: {
          name: data.name,
          externalId: data.externalId,
          apiSource: data.apiSource,
          averageDuration: data.averageDuration ?? null,
          minPlayers: data.minPlayers ?? null,
          maxPlayers: data.maxPlayers ?? null,
          imageUrl: data.imageUrl ?? null
        },
        update: {
          name: data.name,
          apiSource: data.apiSource,
          averageDuration: data.averageDuration ?? null,
          minPlayers: data.minPlayers ?? null,
          maxPlayers: data.maxPlayers ?? null,
          imageUrl: data.imageUrl ?? undefined
        }
      })
    }

    return prisma.game.create({
      data: {
        name: data.name,
        apiSource: data.apiSource,
        averageDuration: data.averageDuration ?? null,
        minPlayers: data.minPlayers ?? null,
        maxPlayers: data.maxPlayers ?? null,
        imageUrl: data.imageUrl ?? null
      }
    })
  }

  static async updateImageUrl(id: number, imageUrl: string) {
    return prisma.game.update({ where: { id }, data: { imageUrl } })
  }
}







