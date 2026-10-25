# Design

## Context

Dependency tree in 2.3.0 (`npm ls undici http-cookie-agent`):

```
panasonic-comfort-cloud-client@2.3.0
+-- axios-cookiejar-support@5.0.5    (CommonJS)
|   +-- http-cookie-agent@6.0.8      optional peer undici "^5.11.0 || ^6.0.0"
+-- cheerio@1.2.0                    dependency undici "^7.19.0", engines node >=20.18.1
    +-- undici@7.29.0
```

Reproduced on 2026-10-25 with `npx npm@10 ci`: the library's own lock file installs fine, but a consumer lock file (ioBroker adapter) fails with `Missing: undici@6.29.1 from lock file`, because npm 10 tries to satisfy the nested `http-cookie-agent@6` peer in the consumer tree. With a newer `axios-cookiejar-support` (installed from a local tarball) the consumer lock passes `npm@10 ci`.

Findings from a first implementation attempt with v6:
- `axios-cookiejar-support@6` and `@7` are ESM-only (`"type": "module"`). The library builds CommonJS (`tsconfig`: `module: nodenext`, no `"type"` in `package.json`), so `require('axios-cookiejar-support')` relies on Node's `require(esm)`.
- jest (CommonJS, ts-jest) cannot parse the ESM file: `ComfortCloudClient.test.ts` and `HistoryData.test.ts` fail with "Cannot use import statement outside a module" (34 instead of 53 tests run).
- Loading the built library with `require()` works on Node 26.

`axios-cookiejar-support` is only used in `src/OAuthClient.ts` (`wrapper(axios.create({ jar }))`). Motivation: see proposal.md.

## Goals / Non-Goals

**Goals:** consumer lock files accepted by `npm ci` on npm 10 and 11; current, maintained cookie stack; no API or runtime behavior change.

**Non-Goals:**
- Converting the library itself to ESM (would force consumers to `import()`; not needed).
- Upgrading `tough-cookie` (4 → 6) or `cheerio`.
- Supporting Node < 22.12 in 3.x.

## Decisions

1. **`axios-cookiejar-support@^7` (not v6)** – both are ESM-only, so both need `require(esm)` (Node ≥ 22.12). v7 is the current line, needs Node ≥ 22 (no extra cost given the 22.12 requirement) and accepts `undici ^7 || ^8`, so the next undici major does not reopen the conflict. Alternatives: v5 + direct `undici@^6` dependency (no Node bump, but two undici copies and a pinned old peer) – rejected in favor of the current line; dropping `axios-cookiejar-support` – rejected, rewrites the cookie handling in the Auth0 flow.
2. **`engines: node >=22.12.0`** – first release line where `require(esm)` is enabled by default. npm only warns on mismatch; the hard failure for older Node is `ERR_REQUIRE_ESM` at load time, documented in README and CHANGELOG.
3. **Release 3.0.0** – raising the minimum Node version is a breaking change for consumers even though the API is unchanged.
4. **jest: stub the cookie wrapper via `moduleNameMapper`** – map `^axios-cookiejar-support$` to `test/__mocks__/axios-cookiejar-support.ts` (`wrapper = instance => instance`). Unit tests mock all HTTP anyway, so the real cookie handling is not exercised there. Alternative: `transformIgnorePatterns` + JS transform for `axios-cookiejar-support|http-cookie-agent` – works, but needs `allowJs` handling in ts-jest and couples tests to the dependency's internals.
5. **Smoke test for the real ESM path** – run `require()` of the built `dist/src/index.js` with Node 22.12.0 (`npx -p node@22.12.0 node -e ...`) and with the current Node, plus a real CLI login. This covers what the jest stub hides.
6. **CI matrix 22.x, 24.x, 26.x** – matches the supported range and the ioBroker repository checker's requirement for Node 26.

## Risks / Trade-offs

- [Users on Node 22.0–22.11 or Node 20 break with 3.x] → major version, `engines` field, README/CHANGELOG note; they can stay on 2.x.
- [`require(esm)` prints an `ExperimentalWarning` on some 22.x versions] → acceptable (no functional impact); checked in the smoke test and noted in README if it appears.
- [jest stub hides integration issues of the cookie wrapper] → smoke test and real CLI login before release.
- [Two ESM packages in a CJS library are harder to debug] → contained to `OAuthClient.ts`.

## Migration Plan

Release 3.0.0. The ioBroker adapter bumps to `^3.0.0`, raises its `engines` to `>=22.12.0`, regenerates `package-lock.json`, and its CI should turn green. Rollback for consumers: pin `^2.3.0`.

## Open Questions

- Whether Node 22.12 prints an `ExperimentalWarning` for `require(esm)` – answered by the smoke test; affects only a README note.
