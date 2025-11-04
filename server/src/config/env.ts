import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET doit contenir au moins 16 caracteres"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGIN: z.string().optional(),
  BOARD_GAME_API_URL: z.string().url().optional(),
  BOARD_GAME_API_CLIENT_ID: z.string().optional(),
  // Jeton d'application BGG (Bearer) pour l'API XML v2
  BGG_API_TOKEN: z.string().optional(),
  // Intervalle minimal entre appels BGG (ms). Defaut: 5000. Utile en dev.
  BGG_MIN_INTERVAL_MS: z.coerce.number().optional(),
  // Optionnel: cookie de session BGG (si certaines requetes API sont filtrees)
  BGG_COOKIE: z.string().optional()
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors)
  throw new Error("Invalid environment configuration")
}

export const env = parsed.data
