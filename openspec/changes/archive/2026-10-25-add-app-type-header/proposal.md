# Proposal

## Why

The accsmart API only accepts the exact current app version **of the platform declared in `X-APP-TYPE`** (`0` = iOS, `1` = Android). The client hard-codes `X-APP-TYPE: 1`, while consumers such as ioBroker.panasonic-comfort-cloud read the version from the iOS App Store. Since iOS 5.1.1 (2026-10-22, Android still 5.1.0) every login fails with `401 code 4106` (ioBroker.panasonic-comfort-cloud#141). Consumers need to choose the platform that matches their version source.

## What Changes

- New exported `AppType` enum (`IOS = '0'`, `ANDROID = '1'`).
- `ComfortCloudClient` constructor accepts an optional `appType` (default `ANDROID`, i.e. unchanged behavior) and sends it as `X-APP-TYPE` on every accsmart request.
- `ComfortCloudClient` exposes the effective `appVersion` and `appType` read-only.
- New `AppVersionRejectedError` (subclass of `ServiceError`) thrown for code 4106, carrying the rejected version and type – existing `instanceof ServiceError` checks keep working.
- `DEFAULT_APP_VERSION` updated from the stale `3.4.0` to the current Android version.
- CLI asks for the app type in addition to the version.
- Minor release 2.3.0; no breaking changes.

## Capabilities

### New Capabilities
- `app-identity`: how the client identifies app version and platform to the Comfort Cloud API and reports a rejected identity.

### Modified Capabilities
<!-- none: no specs exist yet -->

## Impact

- `src/domain/apiHelper.ts`, `src/domain/appVersion.ts`, new `src/domain/appType.ts` (or in `enums.ts`), `src/ComfortCloudClient.ts`, new `src/model/AppVersionRejectedError.ts`, `src/index.ts` exports, `src/index-cli.ts`.
- Tests in `test/` (jest), `README.md`, `CHANGELOG.md`.
- Consumers: ioBroker.panasonic-comfort-cloud change `fix-app-version-platform-mismatch` depends on this release.
