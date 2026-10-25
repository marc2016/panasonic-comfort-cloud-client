# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2026-10-25

### Changed
- **BREAKING:** requires Node.js 22.12 or newer. `axios-cookiejar-support` was updated to 7.x (with `http-cookie-agent` 8.x), which is ESM-only and is loaded through `require()`; Node versions before 22.12 fail with `ERR_REQUIRE_ESM`. Stay on 2.x for older Node versions.
- CI tests on Node 22, 24 and 26.

### Fixed
- Peer dependency conflict between `http-cookie-agent` (needed `undici` 5/6) and `cheerio` (installs `undici` 7) that made `npm ci` fail with npm 10 in consuming projects (`Missing: undici@6.x from lock file`).

## [2.3.0] - 2026-10-25

### Added
- `AppType` enum and optional `appType` constructor parameter on `ComfortCloudClient` to send `X-APP-TYPE` (`0` = iOS, `1` = Android). The API only accepts the current version of the declared platform, so iOS store versions must be sent as iOS.
- Read-only `appVersion` / `appType` getters on `ComfortCloudClient`.
- `AppVersionRejectedError` (extends `ServiceError`) for error code 4106, including the rejected version and platform.
- CLI asks for the app platform.
- `ComfortCloudClient` / `OAuthClient` accept an optional `onTokenChange` callback that is called whenever access and refresh token change (login, refresh, automatic refresh).
- CLI can remember a login: stores the refresh token (not the password) in the user's config directory with `0600` permissions, reuses it on the next start, saves rotated tokens and offers "Forget saved login".

- `ComfortCloudClient.dispose()` and `OAuthClient.stopAutoRefresh()` to stop the automatic token refresh; optional `onRefreshError` callback.
- `AuthenticationError` (extends `ServiceError`) for failures of the Panasonic OAuth login, with HTTP status and the server's error description.

### Fixed
- A failing automatic token refresh no longer crashes the process with an unhandled promise rejection.
- Repeated logins no longer stack additional automatic refresh timers; the pending timer no longer keeps the process alive (CLI now exits after "Exit").
- Error messages no longer contain `undefined` when the server sends no Comfort Cloud code/message.
- CLI asks for the platform first and suggests a matching default version (iOS: current App Store version).
- CLI prints a readable message and exits with code 1 when the login fails instead of crashing with a stack trace.

### Changed
- `DEFAULT_APP_VERSION` updated from 3.4.0 to 5.1.0 (Android).

## [2.2.0] - 2026-07-25

### Added
- Added CLI `--export-fixtures` option to record and export anonymized live API responses for unit tests.
- Expanded unit test coverage from 14 to 21 tests.

### Changed
- Updated development dependencies to latest compatible versions.

## [2.1.5] - 2025-12-21

### Fixed
- Fixed `getDeviceHistoryData` date formatting logic to always use `YYYYMMDD` format for `DataMode.Month` and `DataMode.Year`, resolving "Expected 1 arguments, but got 2" error and incorrect date format issues.

### Added
- Improved CLI error logging: Now catches errors and logs full `ServiceError` details, including `axios` response data, status, and headers for better debugging.

## [2.1.3]

### Added
- Allow selecting `DataMode` (Day, Week, Month, Year) in CLI history command.

## [2.1.2]

### Fixed
- Added check to filter out invalid devices (e.g. Heat Pumps) that do not provide parameters, preventing crashes (PR #22).

## [2.1.1]

### Added
- Added `getDeviceHistoryData` with full type support (`HistoryDataResponse`) for better developer experience.
- CLI now prompts for App Version on startup (defaults to current known version).

### Fixed
- Corrected various types and examples in `README.md`.
- Improved timezone handling in history data requests.

### Internal
- Major test refactoring: Switched to full mocking (removed dependency on `auth_data.json`), extracted fixtures, and added realistic data scenarios.

## [2.1.0]

### Added
- Support for login with refresh token.
- Added `CFCGenerator`.

## [2.0.0]

### Added
- OAuth support.
- Introduced Command Line Interface (CLI).

### Changed
- Upgraded to ES2022.

### Fixed
- Auto-refresh token fixes.

## [1.1.0]

### Added
- Support for inside/outside temperature.
- Support for nanoe mode.
