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
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: CORS_ORIGIN }))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/clients', clientsRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/import', importRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
