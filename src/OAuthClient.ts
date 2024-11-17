import axios, { AxiosInstance, AxiosResponse } from "axios"
import crypto from 'crypto'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import * as cheerio from 'cheerio'

export class OAuthClient {
  private oauthClient: AxiosInstance
  private appVersion: string | undefined = ''
  private enableAutoRefresh: boolean = true

  private clientId: string = ''
  public token: string = ''
  public tokenRefresh: string = ''

  private readonly BASE_URL = 'https://authglb.digital.panasonic.com'
  private readonly CLIENT_ID = 'Xmy6xIYIitMxngjB2rHvlm6HSDNnaMJx'
  private readonly OAUTH_CLIENT_ID = 'eyJuYW1lIjoiQXV0aDAuQW5kcm9pZCIsImVudiI6eyJhbmRyb2lkIjoiMzAifSwidmVyc2lvbiI6IjIuOS4zIn0='
  private readonly REDIRECT_URL = 'panasonic-iot-cfc://authglb.digital.panasonic.com/android/com.panasonic.ACCsmart/callback'

  constructor(appVersion?: string, enableAutoRefresh: boolean = true) {
    this.appVersion = appVersion
    this.enableAutoRefresh = enableAutoRefresh
    const jar = new CookieJar()
    this.oauthClient = wrapper(axios.create({
      baseURL: this.BASE_URL,
      maxRedirects: 0,
      jar
    }))
  }

  async oAuthProcess(
    username: string,
    password: string) : Promise<string> {

      const codeVerifier = this.generateRandomString(32)
      

      const [location, state] = await this.authorize(codeVerifier)

      const csrf = await this.authorizeRedirect(location)
      if(csrf == undefined)
        throw new Error('CSRF is undefined.')

      const parameters = await this.login(username, password, csrf, state)
      
      const loginLocation = await this.loginCallback(parameters)
 
      const code = await this.loginRedirect(loginLocation)
      if(code == undefined)
        throw new Error('code is null.')

      const [token, tokenRefresh] = await this.getNewToken(code, codeVerifier)
      this.tokenRefresh = tokenRefresh
      this.token = token

      if(this.enableAutoRefresh)
        setTimeout(this.refreshToken.bind(this), 86300000)

      return token
  }

  private async authorize(codeVerifier: string): Promise<[string, string]> {
    let location: string = ''
    let state: string | null = ''
    const randomState = this.generateRandomString(20)
    const hash = crypto.createHash('sha256').update(codeVerifier, 'utf8').digest()
    const base64String = Buffer.from(hash).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const codeChallenge: string = base64String
    
    const response = await this.oauthClient.get(
      '/authorize',
      {
        params : {
          scope: 'openid offline_access comfortcloud.control a2w.control',
          audience: `https://digital.panasonic.com/${this.CLIENT_ID}/api/v1/`,
          protocol: 'oauth2',
          response_type: 'code',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          auth0Client: this.OAUTH_CLIENT_ID,
          client_id: this.CLIENT_ID,
          redirect_uri: this.REDIRECT_URL,
          state: randomState,
        },
        validateStatus: status => (status >= 200 && status < 300) || status === 302,
      }
    )
    location = response.headers['location']
    state = this.getQuerystringParameterFromHeaderEntryUrl(response, 'location', 'state', 'https://authglb.digital.panasonic.com') ?? ''
    return [location, state]
  }

  private async authorizeRedirect(location: string): Promise<string | undefined> { 
    const response = await this.oauthClient.get(
      location,
      {
        validateStatus: status => (status >= 200 && status < 300) || status === 200,
      }
    )
    const csrf = (response.headers['set-cookie'] as string[])
      .find(cookie => cookie.includes('_csrf'))
      ?.match(new RegExp('^_csrf=(.+?)'))
      ?.[1]
     return csrf
  }

  private async login(username: string, password: string, csrf: string, state: string): Promise<any> {
    const response = await this.oauthClient.post(
      '/usernamepassword/login',
      {
        'client_id': this.CLIENT_ID,
        'redirect_uri': this.REDIRECT_URL,
        'tenant': 'pdpauthglb-a1',
        'response_type': 'code',
        'scope': 'openid offline_access comfortcloud.control a2w.control',
        'audience': 'https://digital.panasonic.com/' + this.CLIENT_ID +'/api/v1/',
        '_csrf': csrf,
        'state': state,
        '_intstate': 'deprecated',
        'username': username,
        'password': password,
        'lang': 'en',
        'connection': 'PanasonicID-Authentication',
      },
      {
        headers: {
          'Auth0-Client': this.OAUTH_CLIENT_ID,
          'user-agent': 'okhttp/4.10.0',
        },
        validateStatus: status => (status >= 200 && status < 300) || status === 302,
      })

      const $ = cheerio.load(response.data)
      const elements = $('input[type="hidden"]')

      const parameters: any = {}
      for (const el of elements) {
        parameters[el.attribs.name] = el.attribs.value
      }

      return parameters
  }

  private async loginCallback(parameters: any): Promise<string> {
    const response = await this.oauthClient.post(
      '/login/callback',
      parameters,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 '
            + '(KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36',
        },
        validateStatus: status => (status >= 200 && status < 300) || status === 302,
      }
    )
    const location = response.headers['location']
    return location
  }

  private async getNewToken(code: string, codeVerifier: string): Promise<[string, string]> {
    const response = await this.oauthClient.post(
      '/oauth/token',
      {
        'scope': 'openid',
        'client_id': this.CLIENT_ID,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': this.REDIRECT_URL,
        'code_verifier': codeVerifier,
      },
      {
        headers: {
          'Auth0-Client': this.OAUTH_CLIENT_ID,
          'user-agent': 'okhttp/4.10.0',
        },
        validateStatus: status => (status >= 200 && status < 300) || status === 302,
      }
    )
    const token = response.data.access_token
    const tokenRefresh = response.data.refresh_token
    return [token, tokenRefresh]
  }

  public async refreshToken(tokenRefresh: string = this.tokenRefresh): Promise<string | null> {
    const response = await this.oauthClient.post(
      '/oauth/token',
      {
        'scope': 'openid offline_access comfortcloud.control a2w.control',
        'client_id': this.CLIENT_ID,
        'refresh_token': tokenRefresh,
        'grant_type': 'refresh_token',
      },
      {
        headers: {
          'Auth0-Client': this.OAUTH_CLIENT_ID,
          'Content-Type': 'application/json',
          'User-Agent': 'okhttp/4.10.0',
        },
      }
    )

    if(response.status != 200)
      return null

    this.token = response.data.access_token
    this.tokenRefresh = response.data.refresh_token

    if(this.enableAutoRefresh)
      setTimeout(this.refreshToken.bind(this), 86300000)

    return this.token
  }

  private async loginRedirect(location: string): Promise<string|null> {
    const response = await this.oauthClient.get(
      location,
      {
        validateStatus: status => (status >= 200 && status < 300) || status === 302,
      }
    )
    const code = this.getQuerystringParameterFromHeaderEntryUrl(response, 'location', 'code', 'https://authglb.digital.panasonic.com')
    return code
  }

  

  generateRandomString(length: number): string {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }

  

  

  getQuerystringParameterFromHeaderEntryUrl(response: AxiosResponse, headerEntry: string, querystringParameter: string, baseUrl: string): string | null {
    const headerEntryValue = response.headers[headerEntry]
    const parsedUrl = new URL(headerEntryValue.startsWith('/') ? baseUrl + headerEntryValue : headerEntryValue)
    const params = new URLSearchParams(parsedUrl.search)
    return params.get(querystringParameter) || null
  }
}