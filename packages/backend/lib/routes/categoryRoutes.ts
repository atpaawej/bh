import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { categoryService } from '../services/categoryService'

const router = Router()

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await categoryService.list()
    res.json(categories)
  })
)

export default router
