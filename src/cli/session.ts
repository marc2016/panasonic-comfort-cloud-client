import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { AppType } from '../domain/enums.js'

const SESSION_VERSION = 1

export interface Session {
  username: string
  appVersion: string
  appType: AppType
  refreshToken: string
  savedAt: string
}

function configDir(): string {
  if (process.env.XDG_CONFIG_HOME)
    return process.env.XDG_CONFIG_HOME
  if (process.platform === 'win32' && process.env.APPDATA)
    return process.env.APPDATA
  return path.join(os.homedir(), '.config')
}

export function sessionPath(): string {
  return path.join(configDir(), 'panasonic-comfort-cloud-client', 'session.json')
}

export function loadSession(): Session | undefined {
  try {
    const data = JSON.parse(fs.readFileSync(sessionPath(), 'utf-8'))
    if (data?.version !== SESSION_VERSION || !data.refreshToken || !data.appVersion)
      return undefined
    return {
      username: data.username ?? '',
      appVersion: data.appVersion,
      appType: data.appType === AppType.IOS ? AppType.IOS : AppType.ANDROID,
      refreshToken: data.refreshToken,
      savedAt: data.savedAt ?? '',
    }
  } catch {
    return undefined
  }
}

export function saveSession(session: Omit<Session, 'savedAt'>): void {
  const file = sessionPath()
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  const data = {
    version: SESSION_VERSION,
    username: session.username,
    appVersion: session.appVersion,
    appType: session.appType,
    refreshToken: session.refreshToken,
    savedAt: new Date().toISOString(),
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 })
  fs.chmodSync(file, 0o600)
}

export function sessionExists(): boolean {
  return fs.existsSync(sessionPath())
}

export function deleteSession(): void {
  fs.rmSync(sessionPath(), { force: true })
}
