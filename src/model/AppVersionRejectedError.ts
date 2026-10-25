import { ServiceError } from './ServiceError.js'
import { AppType } from '../domain/enums.js'

export class AppVersionRejectedError extends ServiceError {
  private _appVersion: string
  private _appType: AppType

  constructor(message: string, code: number, httpCode: number, appVersion: string, appType: AppType, details?: any) {
    const platform = appType === AppType.IOS ? 'iOS' : 'Android'
    super(`${message}\nRejected app version ${appVersion} (${platform}, X-APP-TYPE=${appType})`, code, httpCode, details)
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'AppVersionRejectedError'
    this._appVersion = appVersion
    this._appType = appType
  }

  get appVersion(): string {
    return this._appVersion
  }

  get appType(): AppType {
    return this._appType
  }
}
