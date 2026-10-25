# Tasks

## 1. Library hook

- [x] 1.1 Add optional `onTokenChange` callback to `OAuthClient` (called after `oAuthProcess()` and `refreshToken()`, exceptions from the callback caught and ignored); verify with a unit test that it fires once per login/refresh and that behavior without a callback is unchanged
- [x] 1.2 Add optional `options?: { onTokenChange }` as third constructor argument of `ComfortCloudClient` and pass it to `OAuthClient`; verify with a test and that all existing tests still pass

## 2. Session storage

- [x] 2.1 Create `src/cli/session.ts` with `sessionPath()`, `loadSession()`, `saveSession()`, `deleteSession()` (XDG/`~/.config`/`%APPDATA%`, dir `0700`, file `0600`, versioned JSON, parse errors → `undefined`); verify with unit tests using a temp `XDG_CONFIG_HOME` (round trip, mode `0600`, corrupt file, missing file, no password field)

## 3. CLI flow

- [x] 3.1 Offer saved session at start and log in via refresh token with saved version/platform; on failure print "Saved login is no longer valid.", delete the file and continue with prompts; verify manually: start twice, second start needs no credentials; corrupt the file and confirm the fallback
- [x] 3.2 Ask "Remember this login?" after a successful password login and register `onTokenChange` to save rotated tokens; verify manually that "Refresh token" changes the stored token and the next start still works
- [x] 3.3 Wrap the password login in try/catch: print message and service error code, exit with code 1; verify manually with (5.1.0, iOS) that the CLI prints the 4106 message and `echo $?` shows 1
- [x] 3.4 Add menu command "Forget saved login" (deletes the file); verify manually that the next start shows the normal prompts

## 4. Docs and verification

- [x] 4.1 Document the session feature, file location and security note in the README CLI section and add a CHANGELOG entry; verify README renders
- [x] 4.2 Run `npm test`; all tests pass
