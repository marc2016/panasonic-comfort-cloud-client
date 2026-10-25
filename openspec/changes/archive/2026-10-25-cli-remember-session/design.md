# Design

## Context

- `ComfortCloudClient.login(username, password, refreshToken?)` already supports a refresh-token login: `oauthClient.refreshToken(rt)` then `/auth/v2/login`. If the refresh request fails, axios throws (no `validateStatus`), which ends in `handleError()` → thrown error.
- `OAuthClient` keeps `token` / `tokenRefresh` as public fields. Auth0 rotates refresh tokens: every `/oauth/token` refresh returns a new `refresh_token`. With `enableAutoRefresh` it schedules `refreshToken()` every ~24 h via `setTimeout`.
- `src/index-cli.ts` `start()` prompts version → platform → username → password, then calls `login()` unguarded (a failed login crashes with a stack trace). It already has "Print tokens" and "Refresh token" commands.

## Goals / Non-Goals

**Goals:** fast repeated CLI starts, no stored password, rotated tokens never lost, graceful fallback.

**Non-Goals:**
- OS keychain integration (would need a native dependency such as `keytar`).
- Multiple saved accounts/profiles – one session file; can be extended later.
- Session handling for library consumers (e.g. the ioBroker adapter) – they only get the callback hook.

## Decisions

1. **Session file `<configDir>/panasonic-comfort-cloud-client/session.json`**, `configDir` = `$XDG_CONFIG_HOME` or `~/.config` (macOS/Linux), `%APPDATA%` on Windows. Content: `{ version: 1, username, appVersion, appType, refreshToken, savedAt }`. Written with `fs.writeFileSync(path, json, { mode: 0o600 })` after `mkdirSync(dir, { recursive: true, mode: 0o700 })`, then `chmodSync(0o600)` to fix pre-existing files. Alternative: file next to the package / in the CWD – rejected, gets committed or lost.
2. **Token-change callback in the library**: `OAuthClient` gets an optional `onTokenChange?: (tokens: { token: string, refreshToken: string }) => void`, called at the end of `oAuthProcess()` and `refreshToken()`; `ComfortCloudClient` exposes it via an optional third constructor argument `options?: { onTokenChange }`. Alternative: CLI saves after each command by reading `client.oauthClient.tokenRefresh` – misses the automatic 24 h refresh and rotation between commands. Rejected.
3. **Session module `src/cli/session.ts`** with `loadSession()`, `saveSession()`, `deleteSession()`, `sessionPath()`; pure fs logic so it can be unit-tested with a temp `XDG_CONFIG_HOME`.
4. **Start flow**:
   ```
   session = loadSession()            (parse error -> treated as invalid)
   if session && confirm("Use saved login for <user> (<ver>, <platform>)?")
       try login("", "", session.refreshToken) with saved version/type
       catch -> print "Saved login is no longer valid.", deleteSession(), fall through
   if not logged in
       prompts (version, platform, username, password)
       try login(user, pw) catch -> print readable error, exit 1
       if confirm("Remember this login?") -> remember = true, saveSession()
   if remember: onTokenChange -> saveSession() with new refresh token
   ```
   `ComfortCloudClient.login()` falls back to the password flow when `refreshToken()` returns `null`; with empty credentials that fails, which the catch handles.
5. **Prompts** use the existing `@inquirer/prompts` (`confirm` is part of it) – no new dependency.

## Risks / Trade-offs

- [Refresh token on disk grants account access] → opt-in, mode 0600, password never stored, "Forget saved login" command, location documented in README.
- [Windows ignores POSIX modes] → file lives in the user's `%APPDATA%`, documented; acceptable for a debug CLI.
- [Callback throws] → wrap the callback invocation in try/catch inside the library so persistence errors never break the API flow.
- [Two CLI instances rotate the same token] → the older instance's token becomes invalid; next start falls back to the prompts. Acceptable.

## Migration Plan

Additive; ships with the next minor release after 2.3.0 (or together with it if not yet published). No migration needed.
