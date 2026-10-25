import { ServiceError } from '../src/model/ServiceError.js'
import { TokenExpiredError } from '../src/model/TokenExpiredError.js'
import { AdapterCommunicationError } from '../src/model/AdapterCommunicationError.js'
import { AppVersionRejectedError } from '../src/model/AppVersionRejectedError.js'
import { AppType } from '../src/domain/enums.js'

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

  test('AppVersionRejectedError should inherit from ServiceError and carry version and type', () => {
    const error = new AppVersionRejectedError('New version app has been published', 4106, 401, '5.1.1', AppType.ANDROID)
    expect(error.code).toBe(4106)
    expect(error.httpCode).toBe(401)
    expect(error.appVersion).toBe('5.1.1')
    expect(error.appType).toBe(AppType.ANDROID)
    expect(error.message).toContain('5.1.1')
    expect(error.message).toContain('Android')
    expect(error instanceof ServiceError).toBeTruthy()
    expect(error instanceof AppVersionRejectedError).toBeTruthy()
  })
})
