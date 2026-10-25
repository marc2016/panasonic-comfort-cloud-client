import axios from 'axios'
import { OAuthClient } from '../src/OAuthClient.js'

jest.mock('axios')
jest.mock('axios-cookiejar-support', () => ({ wrapper: (instance: any) => instance }))
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('OAuthClient token change callback', () => {
  const post = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.create = jest.fn(() => ({ post } as any))
    post.mockResolvedValue({ status: 200, data: { access_token: 'new-token', refresh_token: 'new-refresh' } })
  })

  test('refreshToken calls the callback once with the new tokens', async () => {
    const onTokenChange = jest.fn()
    const client = new OAuthClient('5.1.0', false, onTokenChange)

    await client.refreshToken('old-refresh')

    expect(onTokenChange).toHaveBeenCalledTimes(1)
    expect(onTokenChange).toHaveBeenCalledWith({ token: 'new-token', refreshToken: 'new-refresh' })
  })

  test('oAuthProcess calls the callback once with the new tokens', async () => {
    const onTokenChange = jest.fn()
    const client = new OAuthClient('5.1.0', false, onTokenChange)
    const internals = client as any
    jest.spyOn(internals, 'authorize').mockResolvedValue(['location', 'state'])
    jest.spyOn(internals, 'authorizeRedirect').mockResolvedValue('csrf')
    jest.spyOn(internals, 'login').mockResolvedValue({})
    jest.spyOn(internals, 'loginCallback').mockResolvedValue('login-location')
    jest.spyOn(internals, 'loginRedirect').mockResolvedValue('code')
    jest.spyOn(internals, 'getNewToken').mockResolvedValue(['token', 'refresh'])

    await client.oAuthProcess('user', 'password')

    expect(onTokenChange).toHaveBeenCalledTimes(1)
    expect(onTokenChange).toHaveBeenCalledWith({ token: 'token', refreshToken: 'refresh' })
  })

  test('errors thrown by the callback do not break the refresh', async () => {
    const client = new OAuthClient('5.1.0', false, () => { throw new Error('disk full') })

    await expect(client.refreshToken('old-refresh')).resolves.toBe('new-token')
    expect(client.tokenRefresh).toBe('new-refresh')
  })

  test('without a callback the refresh behaves as before', async () => {
    const client = new OAuthClient('5.1.0', false)

    await expect(client.refreshToken('old-refresh')).resolves.toBe('new-token')
    expect(client.token).toBe('new-token')
  })
})

describe('OAuthClient automatic refresh', () => {
  const post = jest.fn()
  const DAY = 86300000

  function stubOAuthFlow(client: OAuthClient) {
    const internals = client as any
    jest.spyOn(internals, 'authorize').mockResolvedValue(['location', 'state'])
    jest.spyOn(internals, 'authorizeRedirect').mockResolvedValue('csrf')
    jest.spyOn(internals, 'login').mockResolvedValue({})
    jest.spyOn(internals, 'loginCallback').mockResolvedValue('login-location')
    jest.spyOn(internals, 'loginRedirect').mockResolvedValue('code')
    jest.spyOn(internals, 'getNewToken').mockResolvedValue(['token', 'refresh'])
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockedAxios.create = jest.fn(() => ({ post } as any))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('repeated logins leave exactly one pending refresh', async () => {
    const client = new OAuthClient('5.1.0', true)
    stubOAuthFlow(client)

    await client.oAuthProcess('user', 'password')
    await client.oAuthProcess('user', 'password')
    await client.oAuthProcess('user', 'password')

    expect(jest.getTimerCount()).toBe(1)
  })

  test('successful automatic refresh schedules exactly one new refresh', async () => {
    post.mockResolvedValue({ status: 200, data: { access_token: 'new-token', refresh_token: 'new-refresh' } })
    const client = new OAuthClient('5.1.0', true)
    stubOAuthFlow(client)
    await client.oAuthProcess('user', 'password')

    await jest.advanceTimersByTimeAsync(DAY)

    expect(post).toHaveBeenCalledTimes(1)
    expect(client.token).toBe('new-token')
    expect(jest.getTimerCount()).toBe(1)
  })

  test('failed automatic refresh calls onRefreshError, does not reject and stops refreshing', async () => {
    const unhandled = jest.fn()
    process.on('unhandledRejection', unhandled)
    const refreshError = new Error('refresh failed')
    post.mockRejectedValue(refreshError)
    const onRefreshError = jest.fn()
    const client = new OAuthClient('5.1.0', true, undefined, onRefreshError)
    stubOAuthFlow(client)
    await client.oAuthProcess('user', 'password')

    await jest.advanceTimersByTimeAsync(DAY)
    await Promise.resolve()

    expect(onRefreshError).toHaveBeenCalledWith(refreshError)
    expect(client.token).toBe('token')
    expect(jest.getTimerCount()).toBe(0)
    expect(unhandled).not.toHaveBeenCalled()
    process.off('unhandledRejection', unhandled)
  })

  test('throwing onRefreshError handler is ignored', async () => {
    post.mockRejectedValue(new Error('refresh failed'))
    const client = new OAuthClient('5.1.0', true, undefined, () => { throw new Error('handler failed') })
    stubOAuthFlow(client)
    await client.oAuthProcess('user', 'password')

    await expect(jest.advanceTimersByTimeAsync(DAY)).resolves.not.toThrow()
    expect(jest.getTimerCount()).toBe(0)
  })

  test('stopAutoRefresh cancels the pending refresh', async () => {
    const client = new OAuthClient('5.1.0', true)
    stubOAuthFlow(client)
    await client.oAuthProcess('user', 'password')

    client.stopAutoRefresh()

    expect(jest.getTimerCount()).toBe(0)
  })
})
