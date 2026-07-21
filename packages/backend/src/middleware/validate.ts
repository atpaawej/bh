import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from './errorHandler'

export const validate = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const details = result.error.flatten().fieldErrors
      throw AppError.validation('Invalid request body', details)
    }

    req.body = result.data
    next()
  }
