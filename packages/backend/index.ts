import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './lib/config'
import { errorHandler } from './lib/middleware/errorHandler'
import { apiLimiter } from './lib/middleware/rateLimiter'
import productRoutes from './lib/routes/productRoutes'
import categoryRoutes from './lib/routes/categoryRoutes'

const app = express()

// ── Security ──
app.use(helmet())
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Body parsing ──
app.use(express.json({ limit: '1mb' }))

// ── Rate limit all API routes ──
app.use('/api', apiLimiter)

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes ──
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)

// ── Error handler (MUST be last) ──
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`🚀 BharatHunt API running on port ${config.port}`)
})

export default app
