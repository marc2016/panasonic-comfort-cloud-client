import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { deleteSession, loadSession, saveSession, sessionPath } from '../src/cli/session.js'
import { AppType } from '../src/domain/enums.js'

describe('CLI session storage', () => {
  let tempDir: string
  const originalXdg = process.env.XDG_CONFIG_HOME

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcc-session-'))
    process.env.XDG_CONFIG_HOME = tempDir
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
    if (originalXdg === undefined)
      delete process.env.XDG_CONFIG_HOME
    else
      process.env.XDG_CONFIG_HOME = originalXdg
  })

  const session = { username: 'user@example.com', appVersion: '5.1.1', appType: AppType.IOS, refreshToken: 'refresh' }

  test('sessionPath honors XDG_CONFIG_HOME', () => {
    expect(sessionPath()).toBe(path.join(tempDir, 'panasonic-comfort-cloud-client', 'session.json'))
  })

  test('save and load round trip without password', () => {
    saveSession(session)
    const loaded = loadSession()
    expect(loaded).toMatchObject(session)
    expect(loaded?.savedAt).toBeTruthy()
    const raw = fs.readFileSync(sessionPath(), 'utf-8')
    expect(raw).not.toMatch(/password/i)
  })

  if (process.platform !== 'win32') {
    test('session file is owner-only (0600)', () => {
      saveSession(session)
      expect(fs.statSync(sessionPath()).mode & 0o777).toBe(0o600)
    })

    test('existing file with wider permissions is tightened', () => {
      fs.mkdirSync(path.dirname(sessionPath()), { recursive: true })
      fs.writeFileSync(sessionPath(), '{}', { mode: 0o644 })
      saveSession(session)
      expect(fs.statSync(sessionPath()).mode & 0o777).toBe(0o600)
    })
  }

  test('missing file returns undefined', () => {
    expect(loadSession()).toBeUndefined()
  })

  test('corrupt file returns undefined', () => {
    fs.mkdirSync(path.dirname(sessionPath()), { recursive: true })
    fs.writeFileSync(sessionPath(), 'not json')
    expect(loadSession()).toBeUndefined()
  })

  test('deleteSession removes the file and ignores a missing file', () => {
    saveSession(session)
    deleteSession()
    expect(fs.existsSync(sessionPath())).toBe(false)
    expect(() => deleteSession()).not.toThrow()
  })
})
