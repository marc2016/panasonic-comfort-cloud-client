# Tasks

## 1. Dependencies and engines

- [x] 1.1 Upgrade `axios-cookiejar-support` to `^7.0.0` (`npm install axios-cookiejar-support@^7.0.0`); verify `npm ls undici http-cookie-agent` shows `http-cookie-agent@8.x` and no `invalid` entry
- [x] 1.2 Set `"engines": { "node": ">=22.12.0" }` in `package.json` (replacing the earlier `>=20.18.1`); verify `npm pack --dry-run` succeeds
- [x] 1.3 Verify consumer installs with npm 10: pack the library, install the tarball into a scratch copy of the ioBroker adapter (`npm install --package-lock-only <tgz>`), then run `npx npm@10 ci --ignore-scripts` there; it succeeds without `Missing: ... from lock file`

## 2. Tests and CI

- [x] 2.1 Add `test/__mocks__/axios-cookiejar-support.ts` (`export const wrapper = (instance: any) => instance`) and map `^axios-cookiejar-support$` to it in `jest.json` `moduleNameMapper`; verify `npm test` runs all suites again (53 tests) and passes
- [x] 2.2 Smoke-test the real ESM path: `npx -y -p node@22.12.0 node -e "require('./dist/src/index.js')"` and the same with the local Node both load without error; record whether an `ExperimentalWarning` is printed
- [x] 2.3 Change the matrix in `.github/workflows/nodejs.yml` to `[22.x, 24.x, 26.x]`; verify the matrix line is present and the indentation unchanged
- [x] 2.4 Log in with a real account via the CLI (`node dist/src/index-cli.js`) and fetch groups; verify the cookie-based OAuth flow still works

## 3. Docs and release

- [x] 3.1 Document the Node requirement (≥ 22.12, `ERR_REQUIRE_ESM` on older versions, stay on 2.x) in `README.md` and add a `3.0.0` entry with a **BREAKING** note to `CHANGELOG.md`; verify README renders
- [ ] 3.2 Commit on `master`, bump to 3.0.0 (`npm version 3.0.0 --no-git-tag-version`, `chore: release version 3.0.0`), push and `npm publish` (requires explicit approval); verify `npm view panasonic-comfort-cloud-client version` shows 3.0.0
- [ ] 3.3 Verify the library's GitHub Actions run (`nodejs.yml`) for the release commit is green on 22.x, 24.x and 26.x
