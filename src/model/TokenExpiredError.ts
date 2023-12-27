import { ServiceError } from './ServiceError.js'

export class TokenExpiredError extends ServiceError {
  constructor(message: string, code: number, httpCode: number) {
    super(message, code, httpCode)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
