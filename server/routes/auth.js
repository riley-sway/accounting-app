import { Router } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || 'password'

router.post('/login', (req, res) => {
  const { password } = req.body
  if (!password || password !== LOGIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' })
  }
  const token = jwt.sign({ auth: true }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token })
})

export default router
