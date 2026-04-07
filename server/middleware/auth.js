import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null) ?? req.query.token ?? null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
