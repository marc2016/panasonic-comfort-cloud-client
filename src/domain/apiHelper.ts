import { CFCGenerator } from "../CFCGenerator";
import { DEFAULT_APP_VERSION } from "./appVersion";
import { getFormattedTimestamp } from "./helper";

export function getBaseRequestHeaders(appVersion: string = DEFAULT_APP_VERSION, token: string|null = null) {
  const cfcGenerator = new CFCGenerator()
  const timestamp = getFormattedTimestamp()
  const key = cfcGenerator.generateKey(timestamp, token)
  return {
    'Accept': 'application/json; charset=UTF-8',
    'Content-Type': 'application/json',
    'User-Agent': 'G-RAC',
    'X-APP-NAME': 'Comfort Cloud',
    'X-APP-TIMESTAMP': timestamp,
    'X-APP-TYPE': '1',
    'X-APP-VERSION': appVersion,
    'X-CFC-API-KEY': key,
  }
}