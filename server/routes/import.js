import { Router } from 'express'
import { runImport } from '../scripts/importQuickbooks.js'

const router = Router()

router.post('/quickbooks', async (req, res, next) => {
  try {
    const result = await runImport({ clearExisting: true })
    res.status(result.success ? 200 : 500).json(result)
  } catch (err) {
    next(err)
  }
})


export default router
