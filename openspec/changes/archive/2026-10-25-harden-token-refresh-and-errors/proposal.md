# Proposal

## Why

While implementing `add-app-type-header` and `cli-remember-session` several defects showed up around the OAuth token handling:

- The automatic token refresh is started with `setTimeout(this.refreshToken.bind(this), …)`. If that refresh fails, the rejected promise is unhandled and Node (≥ 15) terminates the process – for long-running consumers such as the ioBroker adapter a failing refresh after 24 h crashes the adapter.
- Every login and every refresh schedules an additional timer without clearing the previous one. Consumers that re-login on `TokenExpiredError` (the ioBroker adapter does) accumulate parallel refresh chains. There is no way to stop them on shutdown (ioBroker requires all timers to be cleared in `onUnload`).
- The pending 24 h timer keeps short-lived processes alive: the CLI does not exit after "Exit".
- Errors from the Auth0 host (`authglb.digital.panasonic.com`) are wrapped as `ServiceError` with `code: undefined` and the message `…\nundefined`, because Auth0 bodies use `error` / `error_description` / `description` instead of Comfort Cloud's numeric `code` / `message`. Wrong passwords and expired refresh tokens are therefore indistinguishable and unreadable.
- The CLI asks for the app version before the platform and always suggests the Android default, which led to sending (5.1.0, iOS) by accident.

## What Changes

- Automatic refresh: at most one pending timer per client, previous timer cleared before scheduling; timer does not keep the process alive (`unref`); refresh failures are caught (no unhandled rejection) and reported through an optional callback.
- New `ComfortCloudClient.dispose()` (delegating to `OAuthClient.stopAutoRefresh()`) that cancels the automatic refresh.
- New `AuthenticationError` (subclass of `ServiceError`) for failures of the OAuth host, carrying the HTTP status and the server's error id/description; error messages never contain `undefined`.
- Comfort Cloud errors without a numeric code keep `ServiceError` but get a clean message.
- CLI: ask for the platform first and suggest a matching default version (iOS: current App Store version, looked up live; Android: library default); remove the CLI-side `\nundefined` workaround; call `dispose()` on exit.

## Capabilities

### New Capabilities
- `token-refresh`: lifecycle of the automatic OAuth token refresh (scheduling, failure handling, stopping).
- `error-reporting`: how API and authentication failures are surfaced to callers.
- `cli-login-prompts`: order and defaults of the CLI login prompts.

### Modified Capabilities
<!-- none: no main specs exist yet -->

## Impact

- `src/OAuthClient.ts`, `src/ComfortCloudClient.ts`, new `src/model/AuthenticationError.ts`, `src/index.ts`, `src/index-cli.ts`.
- Tests in `test/`, `README.md`, `CHANGELOG.md` (part of the unreleased 2.3.0).
- Consumers: ioBroker adapter should call `dispose()` in `onUnload` and may handle `AuthenticationError` (follow-up in the adapter change).
- Behavior change for callers that relied on the process being kept alive by the refresh timer: none known; long-running consumers keep their own event loop alive.
