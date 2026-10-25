# Tasks

## 1. Automatic refresh

- [x] 1.1 Store the refresh timer in `OAuthClient`, add `scheduleAutoRefresh()` (clears previous timer, `unref()`) and use it from `oAuthProcess()` and `refreshToken()`; verify with jest fake timers that three logins leave exactly one pending timer (`jest.getTimerCount() === 1`)
- [x] 1.2 Run the scheduled refresh through `autoRefresh()` which catches failures, clears the timer and calls the optional `onRefreshError` callback (exceptions from it ignored); verify with a test that a rejected refresh triggers the callback, causes no unhandled rejection and leaves no pending timer
- [x] 1.3 Add `OAuthClient.stopAutoRefresh()` and `ComfortCloudClient.dispose()`, and `onRefreshError` in the `ComfortCloudClient` options; verify with tests that after `dispose()` no timer is pending and that the option reaches `OAuthClient`

## 2. Error reporting

- [x] 2.1 Add `src/model/AuthenticationError.ts` (extends `ServiceError`, code `-1`, HTTP status, details) and export it; verify with a test that it is `instanceof ServiceError`
- [x] 2.2 In `handleError()` map Axios errors from the OAuth host to `AuthenticationError` with `HTTP <status>: <description>` and clean up messages of Comfort Cloud errors without numeric code; verify with tests for `/usernamepassword/login` (`{ code: 'invalid_user_password', description }`), `/oauth/token` 403 (`{ error, error_description }`), a Comfort Cloud 500 with empty body, and that 4100/4106/5005 keep their types; no message contains `undefined`

## 3. CLI

- [x] 3.1 Ask for the platform before the version; for iOS suggest the live App Store version (5 s timeout, notice and no default on failure), for Android `DEFAULT_APP_VERSION`; verify by running the CLI: selecting iOS shows the current App Store version as default
- [x] 3.2 Remove the `\nundefined` workaround from `describeError()` and show `AuthenticationError` messages as they are; verify with a fake saved session that the message reads `Saved login is no longer valid (HTTP 403: …)`
- [x] 3.3 Call `client.dispose()` and exit with code 0 after "Exit"; verify the process ends immediately after selecting Exit (`echo $?` → 0)

## 4. Docs and verification

- [x] 4.1 Document `dispose()`, `onRefreshError`, `AuthenticationError` and the `unref` behavior in `README.md`; extend the 2.3.0 `CHANGELOG.md` entry; verify README renders
- [x] 4.2 Run `npm test`; all tests pass
