# Design

## Context

Probe of `POST /auth/v2/login` with an invalid token on 2026-10-25 (`4100` = version accepted, `4106` = rejected): Android accepts only 5.1.0, iOS only 5.1.1; any other version is rejected; `X-APP-TYPE: 2` is blocked by CloudFront. Motivation: see proposal.md.

Current code: `getBaseRequestHeaders(appVersion, token)` hard-codes `'X-APP-TYPE': '1'`; all `ComfortCloudClient` calls go through it. `handleError()` maps 4100 → `TokenExpiredError`, 5005 → `AdapterCommunicationError`, everything else → `ServiceError`. `OAuthClient` receives `appVersion` but does not use it.

## Goals / Non-Goals

**Goals:** platform selectable per client, fully backward compatible, distinguishable 4106 error.

**Non-Goals:**
- Fetching versions from App Store / Google Play – stays in the consumer (policy, network, caching differ per consumer).
- Automatic retry with another platform – consumer decides (see adapter change `fix-app-version-platform-mismatch`).
- Changing the OAuth identity (`Auth0.Android`, `okhttp`) – the probe shows the accsmart check is independent of it.

## Decisions

1. **`AppType` as string enum `{ IOS = '0', ANDROID = '1' }` in `src/domain/enums.ts`** – values are the raw header values, so no mapping layer; exported with the existing `export * from './domain/enums.js'`. Alternative: `'ios' | 'android'` union – friendlier, but needs a mapping and differs from the other enums in the file.
2. **Constructor `new ComfortCloudClient(appVersion?: string, appType: AppType = AppType.ANDROID)`** – positional to stay compatible with existing calls. Alternative: options object – cleaner for future options, but a breaking signature change for a hotfix release.
3. **`getBaseRequestHeaders(appVersion, token, appType = AppType.ANDROID)`** – new parameter last, so the exported helper stays compatible.
4. **`AppVersionRejectedError extends ServiceError`** with `appVersion`/`appType` getters, created in `handleError()` for code 4106 – `instanceof ServiceError` and `.code` keep working for existing consumers.
5. **Read-only getters `appVersion` / `appType`** on the client (private fields renamed to `_appVersion` / `_appType`).
6. **`DEFAULT_APP_VERSION = '5.1.0'`** (Android, verified by the probe) – it is only a last resort; consumers should pass a current version.

## Risks / Trade-offs

- [Some endpoints might reject the iOS identity combined with the Android OAuth client] → verify login, groups, device, control and history with a real account for both platforms before release.
- [Default version goes stale again] → documented as fallback only; consumers pass store versions.
- [Renaming private fields] → internal only, no public API impact.

## Migration Plan

Release 2.3.0 (minor). Consumers opt in by passing `AppType.IOS`; no action needed otherwise. Rollback: pin 2.2.0.
