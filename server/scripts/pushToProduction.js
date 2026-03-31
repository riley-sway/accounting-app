import { readFileSync } from 'fs'

const RAILWAY_URL = 'https://accounting-app-production-d30f.up.railway.app'
const MIGRATE_SECRET = process.env.MIGRATE_SECRET

if (!MIGRATE_SECRET) {
  console.error('Set MIGRATE_SECRET env var before running')
  process.exit(1)
}

const data = JSON.parse(readFileSync('./scripts/data-export.json', 'utf8'))

console.log(`Pushing ${data.clients.length} clients and ${data.invoices.length} invoices...`)

const res = await fetch(`${RAILWAY_URL}/api/import/migrate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-migrate-secret': MIGRATE_SECRET,
  },
  body: JSON.stringify(data),
})

const result = await res.json()
console.log(res.ok ? 'Done!' : 'Error:', result)
