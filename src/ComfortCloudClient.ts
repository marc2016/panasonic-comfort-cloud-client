import axios, { AxiosInstance } from 'axios'
import * as https from 'https'
import * as _ from 'lodash'
import { LoginData } from './model/LoginData'
import { ServiceError } from './model/ServiceError'
import { Device } from './model/Device'
import { Group } from './model/Group'
import { Parameters } from './model/Parameters'
import { TokenExpiredError } from './model/TokenExpiredError'

export class ComfortCloudClient {
  readonly baseUrl = 'https://accsmart.panasonic.com'
  readonly urlPartLogin = '/auth/login/'
  readonly urlPartGroup = '/device/group/'
  readonly urlPartDevice = '/deviceStatus/'
  readonly urlPartDeviceControl = '/deviceStatus/control'
  readonly appVersion = '2.0.0'
  private axiosInstance: AxiosInstance

  private _token = ''

  set token(value: string) {
    this._token = value
  }

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
    })
    const agent = new https.Agent({
      rejectUnauthorized: false,
    })

    this.axiosInstance.defaults.httpsAgent = agent
    this.axiosInstance.defaults.headers.common['Accept'] =
      'application/json; charset=UTF-8'
    this.axiosInstance.defaults.headers.common['Content-Type'] =
      'application/json'
    this.axiosInstance.defaults.headers.common['X-APP-TYPE'] = 0
    this.axiosInstance.defaults.headers.common[
      'X-APP-VERSION'
    ] = this.appVersion
  }

  async login(
    username: string,
    password: string,
    language?: number
  ): Promise<string> {
    const loginData = new LoginData(username, password, language)
    try {
      const response = await this.axiosInstance.post(
        this.urlPartLogin,
        loginData
      )
      if (response.status == 200) {
        const newToken = response.data.uToken
        this._token = newToken
        return newToken
      }
      throw new ServiceError(response.data.message, 0, response.status)
    } catch (error) {
      this.handleError(error)
    }
    return ''
  }

  async getGroups(): Promise<Array<Group>> {
    try {
      const response = await this.axiosInstance.get(this.urlPartGroup, {
        headers: { 'X-User-Authorization': this._token },
      })
      if (response.status == 200) {
        const groupsResponse = response.data.groupList
        const groups = _.map(groupsResponse, (element) => {
          const devices = _.map(element.deviceList, (device) => {
            const retDevice = device.parameters as Device
            retDevice.guid = device.deviceGuid
            retDevice.name = device.deviceName
            return retDevice
          })
          return new Group(element.groupId, element.groupName, devices)
        })
        return groups
      }
    } catch (error) {
      this.handleError(error)
    }

    return []
  }

  async getDevice(id: string): Promise<Device | null> {
    try {
      const response = await this.axiosInstance.get(
        this.urlPartDevice + '/' + id,
        {
          headers: { 'X-User-Authorization': this._token },
        }
      )
      if (response.status == 200) {
        const responseData = response.data
        const retDevice = new Device('', '')
        _.assign(retDevice, responseData.parameters)

        retDevice.guid = responseData.deviceGuid
        retDevice.name = responseData.deviceName
        return retDevice
      }
    } catch (error) {
      this.handleError(error)
    }

    return null
  }

  private handleError(error: any): void {
    const errorResponse = error.response
    const responseData = errorResponse.data
    if (responseData.code === '4100') {
      throw new TokenExpiredError(
        responseData.message,
        responseData.code,
        errorResponse.status
      )
    }
    throw new ServiceError(
      responseData.message,
      responseData.code,
      errorResponse.status
    )
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
          headers: { 'X-User-Authorization': this._token },
        }
      )
      return response
    } catch (error) {
      this.handleError(error)
    }

    return null
  }
}
