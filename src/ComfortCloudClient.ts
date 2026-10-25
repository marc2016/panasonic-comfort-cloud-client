import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import * as https from 'https'
import * as crypto from 'crypto'
import _ from 'lodash'

import { LoginData } from './model/LoginData.js'
import { ServiceError } from './model/ServiceError.js'
import { Device } from './model/Device.js'
import { Group } from './model/Group.js'
import { Parameters } from './model/Parameters.js'
import { TokenExpiredError } from './model/TokenExpiredError.js'
import { AdapterCommunicationError } from './model/AdapterCommunicationError.js'
import { AppVersionRejectedError } from './model/AppVersionRejectedError.js'
import { AuthenticationError } from './model/AuthenticationError.js'
import { AppType, DataMode } from './domain/enums.js'
import { getDateForHistoryData, getFormattedTimestamp, getTimezoneForHistoryData } from './domain/helper.js'
import { HistoryDataResponse } from './model/HistoryData.js'
import { OAUTH_BASE_URL, OAuthClient, RefreshErrorCallback, TokenChangeCallback } from './OAuthClient.js'
import { getBaseRequestHeaders } from './domain/apiHelper.js'
import { promises } from 'dns'
import { DEFAULT_APP_VERSION } from './domain/appVersion.js'

export class ComfortCloudClient {
  readonly baseUrl = 'https://accsmart.panasonic.com'
  readonly urlPartLogin = '/auth/login/'
  readonly urlPartGroup = '/device/group/'
  readonly urlPartDevice = '/deviceStatus/'
  readonly urlPartDeviceControl = '/deviceStatus/control'
  readonly urlPartDeviceHistoryData = '/deviceHistoryData'
  readonly defaultAppVersion = DEFAULT_APP_VERSION

  private axiosInstance: AxiosInstance
  public oauthClient: OAuthClient

  private _appVersion: string = ''
  private _appType: AppType = AppType.ANDROID

  private clientId: string = ''


  constructor(appVersion?: string, appType: AppType = AppType.ANDROID, options?: { onTokenChange?: TokenChangeCallback, onRefreshError?: RefreshErrorCallback }) {
    this._appVersion = appVersion || this.defaultAppVersion
    this._appType = appType
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
    })
    this.oauthClient = new OAuthClient(appVersion, true, options?.onTokenChange, options?.onRefreshError)
  }

  get appVersion(): string {
    return this._appVersion
  }

  get appType(): AppType {
    return this._appType
  }

  /** Stops the automatic token refresh. Call this when the client is no longer used. */
  dispose(): void {
    this.oauthClient.stopAutoRefresh()
  }

  async login(
    username: string,
    password: string,
    refreshToken?: string
  ): Promise<string> {
    try {
      if (refreshToken) {
        const token = await this.oauthClient.refreshToken(refreshToken)
        if (token) {
          const clientId = await this.getClientId(token)
          this.clientId = clientId

          return ''
        }
      }

      const token = await this.oauthClient.oAuthProcess(username, password)
      const clientId = await this.getClientId(token)
      this.clientId = clientId
    } catch (error) {
      this.handleError(error)
    }
    return ''
  }

  private async getClientId(token: string): Promise<string> {
    const response = await this.axiosInstance.post(
      '/auth/v2/login',
      {
        'language': 0,
      },
      {
        headers: {
          ...getBaseRequestHeaders(this._appVersion, token, this._appType),
          'X-User-Authorization-V2': 'Bearer ' + token,
        },
        validateStatus: status => (status >= 200 && status < 300) || status === 200,
      }
    )

    const clientId = response.data.clientId;

    return clientId
  }

  async getGroups(): Promise<Array<Group>> {

    try {
      const response = await this.axiosInstance.get(this.urlPartGroup, {
        headers: {
          ...getBaseRequestHeaders(this._appVersion, this.oauthClient.token, this._appType),
          'X-Client-Id': this.clientId,
          'X-User-Authorization-V2': 'Bearer ' + this.oauthClient.token,
        },
      })
      if (response.status == 200) {
        const groupsResponse = response.data.groupList
        const groups = _.map(groupsResponse, (element) => {
          const devices = _.map(element.deviceList, (device) => {
            if (!device || !device.parameters) return null;
            const retDevice = device.parameters;
            retDevice.guid = device.deviceGuid || null;
            retDevice.name = device.deviceName || null;
            return retDevice
          }).filter(d => d); // filter nulls
          return new Group(element.groupId, element.groupName, devices)
        })
        return groups
      }
    } catch (error) {
      this.handleError(error)
    }

    return []
  }

  async getDevice(id: string, name?: string): Promise<Device | null> {
    try {
      const response = await this.axiosInstance.get(
        this.urlPartDevice + id,
        {
          headers: {
            ...getBaseRequestHeaders(this._appVersion, this.oauthClient.token, this._appType),
            'X-Client-Id': this.clientId,
            'X-User-Authorization-V2': 'Bearer ' + this.oauthClient.token,
          },
        }
      )
      if (response.status == 200) {
        const responseData = response.data
        const retDevice = new Device('', '')
        _.assign(retDevice, responseData.parameters)

        retDevice.guid = id
        retDevice.name = name ?? ''
        return retDevice
      }
    } catch (error) {
      this.handleError(error)
    }

    return null
  }

  private handleError(error: unknown): void {
    if (error instanceof AxiosError && error.response) {
      const data = error.response.data
      const httpCode = error.response.status ?? error.status ?? -1

      if (this.isOAuthRequest(error)) {
        const description = data?.error_description ?? data?.description ?? data?.message ?? data?.error ?? error.response.statusText
        throw new AuthenticationError(
          description ? `HTTP ${httpCode}: ${description}` : `HTTP ${httpCode}`,
          httpCode,
          data
        )
      }

      const code = typeof data?.code === 'number' ? data.code : -1
      const message = typeof data?.message === 'string' && data.message
        ? error.message + '\n' + data.message
        : error.message
      switch (code) {
        case 4100:
          throw new TokenExpiredError(message, code, httpCode)
        case 4106:
          throw new AppVersionRejectedError(message, code, httpCode, this._appVersion, this._appType, data)
        case 5005:
          throw new AdapterCommunicationError(message, code, httpCode)
        default:
          throw new ServiceError(message, code, httpCode, data)
      }
    }
    throw error
  }

  private isOAuthRequest(error: AxiosError): boolean {
    const baseURL = error.config?.baseURL ?? ''
    const url = error.config?.url ?? ''
    return baseURL.startsWith(OAUTH_BASE_URL) || url.startsWith(OAUTH_BASE_URL)
  }

  async setDevice(device: Device): Promise<any> {
    return this.setParameters(device.guid, device.parameters)
  }

  async setParameters(guid: string, parameters: Parameters) {
    const body = {
      deviceGuid: guid,
      parameters: parameters,
    }
    try {
      const response = await this.axiosInstance.post(
        this.urlPartDeviceControl,
        body,
        {
          headers: {
            ...getBaseRequestHeaders(this._appVersion, this.oauthClient.token, this._appType),
            'X-Client-Id': this.clientId,
            'X-User-Authorization-V2': 'Bearer ' + this.oauthClient.token,
          },
        }
      )
      return response
    } catch (error) {
      this.handleError(error)
    }

    return null
  }

  async getDeviceHistoryData(deviceGuid: string, date: Date, dataMode: DataMode, timezone?: string): Promise<HistoryDataResponse | null> {
    if (dataMode === DataMode.Year || dataMode === DataMode.Week) {
      throw new ServiceError('DataMode Year and Week are currently not supported', -1, -1)
    }

    const dateString = getDateForHistoryData(date, dataMode)
    const osTimezone = timezone ? timezone : getTimezoneForHistoryData(date)
    const body = {
      deviceGuid: deviceGuid,
      dataMode: dataMode,
      date: dateString,
      osTimezone: osTimezone
    }

    try {
      const response = await this.axiosInstance.post(
        this.urlPartDeviceHistoryData,
        body,
        {
          headers: {
            ...getBaseRequestHeaders(this._appVersion, this.oauthClient.token, this._appType),
            'X-Client-Id': this.clientId,
            'X-User-Authorization-V2': 'Bearer ' + this.oauthClient.token,
          },
        }
      )
      return response.data
    } catch (error) {
      this.handleError(error)
    }

    return null
  }
}
