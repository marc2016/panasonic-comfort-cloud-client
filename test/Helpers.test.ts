import {
  padTo2Digits,
  getDateForHistoryData,
  getTimezoneForHistoryData,
  getFormattedTimestamp
} from '../src/domain/helper.js'
import { AppType, DataMode } from '../src/domain/enums.js'
import { getBaseRequestHeaders } from '../src/domain/apiHelper.js'
import { DEFAULT_APP_VERSION } from '../src/domain/appVersion.js'

describe('Domain Helper Unit Tests', () => {
  test('padTo2Digits should correctly format single and double digits', () => {
    expect(padTo2Digits(5)).toBe('05')
    expect(padTo2Digits(0)).toBe('00')
    expect(padTo2Digits(12)).toBe('12')
    expect(padTo2Digits(100)).toBe('100')
  })

  test('getDateForHistoryData should format Date to YYYYMMDD', () => {
    const testDate = new Date(2025, 4, 9) // May 9, 2025
    expect(getDateForHistoryData(testDate, DataMode.Day)).toBe('20250509')
    expect(getDateForHistoryData(testDate, DataMode.Week)).toBe('20250509')
    expect(getDateForHistoryData(testDate, DataMode.Month)).toBe('20250509')
    expect(getDateForHistoryData(testDate, DataMode.Year)).toBe('20250509')
  })

  test('getTimezoneForHistoryData should format timezone offsets correctly', () => {
    const testDate = new Date()
    const tzString = getTimezoneForHistoryData(testDate)
    expect(tzString).toMatch(/^[+-]\d{2}:\d{2}$/)
  })

  test('getFormattedTimestamp should return timestamp string in YYYY-MM-DD HH:mm:ss format', () => {
    const timestamp = getFormattedTimestamp()
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  test('getBaseRequestHeaders should send the given app type and version', () => {
    const ios = getBaseRequestHeaders('5.1.1', null, AppType.IOS)
    expect(ios['X-APP-TYPE']).toBe('0')
    expect(ios['X-APP-VERSION']).toBe('5.1.1')

    const android = getBaseRequestHeaders('5.1.0', null, AppType.ANDROID)
    expect(android['X-APP-TYPE']).toBe('1')
    expect(android['X-APP-VERSION']).toBe('5.1.0')
  })

  test('getBaseRequestHeaders should default to Android and the default version', () => {
    const headers = getBaseRequestHeaders()
    expect(headers['X-APP-TYPE']).toBe('1')
    expect(headers['X-APP-VERSION']).toBe(DEFAULT_APP_VERSION)
  })
})
