import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import clientsRouter from './routes/clients.js'
import invoicesRouter from './routes/invoices.js'
import dashboardRouter from './routes/dashboard.js'
import reportsRouter from './routes/reports.js'
import settingsRouter from './routes/settings.js'
import importRouter from './routes/import.js'
import authRouter from './routes/auth.js'
import { requireAuth } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: CORS_ORIGIN }))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/clients', requireAuth, clientsRouter)
app.use('/api/invoices', requireAuth, invoicesRouter)
app.use('/api/dashboard', requireAuth, dashboardRouter)
app.use('/api/reports', requireAuth, reportsRouter)
app.use('/api/settings', requireAuth, settingsRouter)
app.use('/api/import', requireAuth, importRouter)

app.use(errorHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
