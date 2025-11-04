import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import 'express-async-errors'

import { env } from './config/env'
import { connectPrisma } from './utils/prisma'
import { errorHandler } from './middlewares/errorHandler'
import authRoutes from './routes/auth.routes'
import sessionRoutes from './routes/session.routes'
import gameRoutes from './routes/game.routes'
import participationRoutes from './routes/participation.routes'
import path from 'node:path'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN ?? true,
    credentials: true
  })
)
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Static serving for uploaded files (game images)
app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '365d', immutable: true }))

app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/games', gameRoutes)
app.use('/api/participations', participationRoutes)

app.use(errorHandler)

const start = async () => {
  await connectPrisma()
  app.listen(env.PORT, () => {
    console.info(`API ready on port ${env.PORT}`)
  })
}

void start()

