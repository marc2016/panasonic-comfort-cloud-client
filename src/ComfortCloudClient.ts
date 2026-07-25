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
import { DataMode } from './domain/enums.js'
import { getDateForHistoryData, getFormattedTimestamp, getTimezoneForHistoryData } from './domain/helper.js'
import { HistoryDataResponse } from './model/HistoryData.js'
import { OAuthClient } from './OAuthClient.js'
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

  private appVersion: string | undefined = ''

  private clientId: string = ''


  constructor(appVersion?: string) {
    this.appVersion = appVersion
    if (!this.appVersion)
      this.appVersion = this.defaultAppVersion
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
    })
    this.oauthClient = new OAuthClient(appVersion)
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
          ...getBaseRequestHeaders(this.appVersion, token),
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
          ...getBaseRequestHeaders(this.appVersion, this.oauthClient.token),
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
            ...getBaseRequestHeaders(this.appVersion, this.oauthClient.token),
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
    if (error instanceof AxiosError) {
      let message: string
      let code: number
      if (error.response) {
        code = error.response?.data.code
        message = error.response?.data.message
        switch (code) {
          case 4100:
            throw new TokenExpiredError(
              error.message + '\n' + message,
              code,
              error.status ?? -1
            )
          case 5005:
            throw new AdapterCommunicationError(
              error.message + '\n' + message,
              code,
              error.status ?? -1
            )
          default:
            throw new ServiceError(
              error.message + '\n' + message,
              code,
              error.status ?? -1,
              error.response?.data
            )
            break;
        }
      }
    }
    throw error
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
            ...getBaseRequestHeaders(this.appVersion, this.oauthClient.token),
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
            ...getBaseRequestHeaders(this.appVersion, this.oauthClient.token),
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
