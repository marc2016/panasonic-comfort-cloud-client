# Design

## Context

- `OAuthClient.oAuthProcess()` and `OAuthClient.refreshToken()` both end with `if (enableAutoRefresh) setTimeout(this.refreshToken.bind(this), 86300000)`. The timer handle is not stored; the async callback's rejection is unhandled (verified: an unhandled rejection terminates Node 26).
- `ComfortCloudClient.handleError()` assumes every `AxiosError` response body has Comfort Cloud's `{ code: number, message }`. Auth0 bodies are `{ error, error_description }` (`/oauth/token`) or `{ name, code: string, description }` (`/usernamepassword/login`); OAuth errors reach `handleError()` because `login()` wraps the whole OAuth flow in its `try`.
- CLI (`src/index-cli.ts`) prompts version → platform; `cli-remember-session` added a `describeError()` workaround that strips `\nundefined`.
- Proposal: see proposal.md – Why.

## Goals / Non-Goals

**Goals:** no crash, no timer leak, process can exit, readable and distinguishable errors, platform-consistent CLI defaults.

**Non-Goals:**
- Retrying a failed automatic refresh (consumers already re-login on `TokenExpiredError`).
- Changing the refresh interval (86 300 s stays).
- Mapping specific Auth0 error ids to separate classes (one `AuthenticationError` with the id in `details`).

## Decisions

1. **Timer handling in `OAuthClient`**: private `refreshTimer?: NodeJS.Timeout`; `scheduleAutoRefresh()` clears an existing timer, then `setTimeout(() => this.autoRefresh(), 86300000).unref()`. `autoRefresh()` = `refreshToken().catch(err => { this.refreshTimer = undefined; this.onRefreshError?.(err) })`. `refreshToken()` keeps scheduling on success via `scheduleAutoRefresh()`. Public `stopAutoRefresh()` clears it. Alternative: `setInterval` – rejected, would keep refreshing with an invalid token after a failure.
2. **Callbacks**: extend the existing options (`cli-remember-session`) to `{ onTokenChange?, onRefreshError? }` on `ComfortCloudClient` and as a fourth constructor argument on `OAuthClient`. Callback exceptions are caught like `onTokenChange`.
3. **`ComfortCloudClient.dispose()`** calls `oauthClient.stopAutoRefresh()`. Name follows common Node/TS convention; idempotent.
4. **Detect OAuth errors by host**: in `handleError()`, if `error.config?.baseURL` (or `error.config?.url`) points to `authglb.digital.panasonic.com` → `AuthenticationError(message, httpStatus, details)` with message `HTTP <status>: <error_description | description | error | statusText>`; `code` is `-1` (ServiceError requires a number). Alternative: detect by body shape – rejected, a Comfort Cloud body without `code` would be misclassified.
5. **Comfort Cloud errors without numeric code** → `ServiceError` with message `<axios message>` plus server message only if present; `code` = `-1`.
6. **CLI defaults**: platform prompt first; for iOS look up `https://itunes.apple.com/lookup?id=1348640525` (axios, 5 s timeout) and use `results[0].version` as default, on failure print "Could not read the App Store version." and prompt without default. Remove the `\nundefined` stripping in `describeError()`. After the menu loop call `client.dispose()`; additionally `process.exit(0)` so inquirer/stdin handles never keep the process alive.

## Risks / Trade-offs

- [`unref()` means a long-running consumer without other handles could miss refreshes] → ioBroker adapters always have live handles (DB connections); documented in README.
- [`code: -1` for auth errors] → callers should use `instanceof AuthenticationError`; documented.
- [App Store lookup adds a network call to CLI start] → only when iOS is selected, short timeout, fail-soft.
- [Behavior change: no automatic refresh after a failed one] → previously the chain also stopped (the crash or the rejection ended it); now explicit and documented.

## Migration Plan

Part of the unreleased 2.3.0; all additions are backward compatible. The ioBroker adapter should call `dispose()` in `onUnload` (add to its change `fix-app-version-platform-mismatch` or a follow-up).
