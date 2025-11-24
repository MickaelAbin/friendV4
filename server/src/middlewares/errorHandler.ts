import { StatusCodes } from "http-status-codes"
import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { AppError } from "../utils/appError.js"

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation echouee",
      issues: err.flatten()
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message })
  }

  console.error(err)
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Une erreur est survenue"
  })
}
