import { ServiceError } from './ServiceError.js'

/** Failure of the Panasonic OAuth login (wrong credentials, invalid refresh token, ...). `code` is always -1. */
export class AuthenticationError extends ServiceError {
  constructor(message: string, httpCode: number, details?: any) {
    super(message, -1, httpCode, details)
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'AuthenticationError'
  }
}
