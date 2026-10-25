# Tasks

## 1. App type in requests

- [x] 1.1 Add `AppType` enum (`IOS = '0'`, `ANDROID = '1'`) to `src/domain/enums.ts`; verify it is exported from `src/index.ts` via `dist/src/index.d.ts` after `npm run build`
- [x] 1.2 Add `appType` parameter (default `ANDROID`) to `getBaseRequestHeaders` and use it for `X-APP-TYPE`; verify with a unit test in `test/Helpers.test.ts` for iOS, Android and default
- [x] 1.3 Add `appType` constructor parameter to `ComfortCloudClient`, pass it to every `getBaseRequestHeaders` call, expose read-only `appVersion` / `appType`; verify with a test in `test/ComfortCloudClient.test.ts` that `login` and `getGroups` send `X-APP-TYPE: 0` for iOS and `1` without type

## 2. Rejected version error

- [x] 2.1 Add `src/model/AppVersionRejectedError.ts` (extends `ServiceError`, carries version and type, message names both) and export it; verify with a test in `test/ServiceError.test.ts` that it is `instanceof ServiceError` with `code === 4106`
- [x] 2.2 Map code 4106 to `AppVersionRejectedError` in `handleError()`; verify with a `ComfortCloudClient` test using a mocked `401 { code: 4106 }` login response, and that 4100 still yields `TokenExpiredError`

## 3. Defaults and CLI

- [x] 3.1 Set `DEFAULT_APP_VERSION` to `5.1.0`; verify via the CLI or a manual request that (5.1.0, Android) is not rejected with 4106
- [x] 3.2 Add an app type prompt (Android default / iOS) to `src/index-cli.ts` and pass it to the client; verify by running the CLI and logging in with (5.1.1, iOS)

## 4. Verification and release

- [x] 4.1 With a real account via the CLI, run get groups, get device, set a parameter and history for both (5.1.1, iOS) and (5.1.0, Android); all succeed
- [x] 4.2 Run `npm test` (build + jest); all tests pass
- [x] 4.3 Document `appType` and `AppVersionRejectedError` in `README.md` and add a `2.3.0` entry to `CHANGELOG.md`
