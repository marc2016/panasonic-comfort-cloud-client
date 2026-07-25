# Changelog

All notable changes to this project will be documented in this file.

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
