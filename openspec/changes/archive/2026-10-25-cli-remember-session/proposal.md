# Proposal

## Why

Every CLI start asks for app version, platform, username and password and runs the full OAuth login. While debugging (e.g. the 4106 platform issue) the CLI is started many times; re-typing credentials is slow and every full login hits Auth0. The client already supports logging in with a refresh token, the CLI just never keeps one.

## What Changes

- After a successful password login the CLI offers to remember the login. If accepted it stores the refresh token together with username, app version and platform in a per-user session file (owner-only permissions). The password is never stored.
- On start, if a saved session exists, the CLI offers to use it, logs in via refresh token and skips the version/platform/credential prompts.
- Refresh tokens rotate: whenever the client obtains a new refresh token (login, manual refresh, automatic refresh) the CLI updates the session file.
- If the saved session is invalid or expired, the CLI says so, deletes it and falls back to the normal prompts instead of crashing.
- New menu command "Forget saved login" deletes the session file.
- A failed password login prints a readable error and exits cleanly instead of an unhandled exception stack trace.
- Library: `OAuthClient` gets an optional callback that is invoked with the new tokens whenever they change, so consumers can persist rotated refresh tokens (backward compatible).

## Capabilities

### New Capabilities
- `cli-session`: remembering, reusing, updating and forgetting a CLI login across runs.

### Modified Capabilities
<!-- none: no main specs exist yet (app-identity is still an unarchived change) -->

## Impact

- `src/index-cli.ts` (start flow, new menu command, error handling), new `src/cli/session.ts` (or similar) for reading/writing the session file.
- `src/OAuthClient.ts` / `src/ComfortCloudClient.ts`: optional token-change callback.
- Tests in `test/`, `README.md` CLI section, `CHANGELOG.md`.
- Security: a refresh token on disk grants account access until revoked or expired; file is created with mode `0600` and its location is documented.
