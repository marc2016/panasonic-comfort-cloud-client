import { ServiceError } from '../src/model/ServiceError.js'
import { TokenExpiredError } from '../src/model/TokenExpiredError.js'
import { AdapterCommunicationError } from '../src/model/AdapterCommunicationError.js'

describe('Error Models Unit Tests', () => {
  test('ServiceError should store message, code, httpCode, and details object', () => {
    const details = { code: 'INVALID_CREDENTIALS', status: 401 }
    const error = new ServiceError('Authentication failed', 40101, 401, details)

    expect(error.message).toBe('Authentication failed')
    expect(error.code).toBe(40101)
    expect(error.httpCode).toBe(401)
    expect(error.details).toEqual(details)
    expect(error instanceof Error).toBeTruthy()
    expect(error instanceof ServiceError).toBeTruthy()
  })

  test('TokenExpiredError should inherit from ServiceError', () => {
    const error = new TokenExpiredError('Token has expired', 40102, 401)
    expect(error.message).toBe('Token has expired')
    expect(error.code).toBe(40102)
    expect(error.httpCode).toBe(401)
    expect(error instanceof ServiceError).toBeTruthy()
  })

  test('AdapterCommunicationError should inherit from ServiceError', () => {
    const error = new AdapterCommunicationError('Failed to communicate with adapter', 50001, 500)
    expect(error.message).toBe('Failed to communicate with adapter')
    expect(error.code).toBe(50001)
    expect(error.httpCode).toBe(500)
    expect(error instanceof ServiceError).toBeTruthy()
  })
})
