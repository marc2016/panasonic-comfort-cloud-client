import { DEFAULT_APP_VERSION } from "./appVersion";

export function getBaseRequestHeaders(appVersion: string = DEFAULT_APP_VERSION) {
  return {
    'Accept': 'application/json; charset=UTF-8',
    'Content-Type': 'application/json',
    'User-Agent': 'G-RAC',
    'X-APP-NAME': 'Comfort Cloud',
    'X-APP-TIMESTAMP': (new Date()).toISOString().replace(/-/g, '')
      .replace('T', ' ').slice(0, 17),
    'X-APP-TYPE': '1',
    'X-APP-VERSION': appVersion,
    'X-CFC-API-KEY': '0',
  }
}