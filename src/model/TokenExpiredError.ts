import { ServiceError } from './ServiceError'

export class TokenExpiredError extends ServiceError {
  constructor(message: string, code: number, httpCode: number) {
    super(message, code, httpCode)
  }
}
