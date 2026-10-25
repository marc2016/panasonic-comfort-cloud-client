# Proposal

## Why

`axios-cookiejar-support@5` depends on `http-cookie-agent@6`, which declares the (optional) peer dependency `undici: ^5.11.0 || ^6.0.0`. `cheerio@1.2` installs `undici@7`. npm 11 tolerates the mismatch, but `npm ci` with npm 10 (Node 22 default) rejects consumer lock files (`Missing: undici@6.29.1 from lock file`). The ioBroker adapter's CI (`test-and-release.yml`) has been red since 2026-10-08 for this reason (repository checker E3031), which can block stable releases.

The only release line of `axios-cookiejar-support` that accepts `undici@7` is ESM-only (v6: Node ≥ 20, v7: Node ≥ 22). This library is compiled to CommonJS, so it can load those packages only through Node's `require(esm)` support, available without flags from Node 22.12. Node 20 has been end-of-life since April 2026 and the main consumer (ioBroker adapter) already requires Node 22, so moving to the current line is preferred over pinning a second `undici` copy.

## What Changes

- Upgrade `axios-cookiejar-support` to `^7.0.0` (`http-cookie-agent@8`, optional peer `undici: ^7.0.0 || ^8.0.0`, matching cheerio's `undici@7`).
- **BREAKING:** minimum Node.js version becomes 22.12.0 (`"engines": { "node": ">=22.12.0" }`); Node 20 and Node 22.0–22.11 are no longer supported (they cannot `require()` the ESM dependency).
- Library CI matrix (`nodejs.yml`): Node 22, 24, 26.
- Unit tests: stub the ESM-only cookie wrapper for jest; the real ESM loading is verified by a separate smoke test on Node 22.12.
- Release **3.0.0** (major because of the Node requirement). Public API and runtime behavior unchanged.

## Capabilities

### New Capabilities
<!-- none: dependency/compatibility change, no API behavior change (skip_specs: true) -->

### Modified Capabilities
<!-- none -->

## Impact

- `package.json`, `package-lock.json`, `jest.json`, new `test/__mocks__/axios-cookiejar-support.ts`, `.github/workflows/nodejs.yml`, `README.md` (requirements), `CHANGELOG.md`.
- Consumers: ioBroker.panasonic-comfort-cloud must bump to `^3.0.0`, raise its `engines` to `>=22.12.0` and regenerate its lock file (tracked as a follow-up in the adapter change `fix-app-version-platform-mismatch`).
- Consumers on Node < 22.12 get `ERR_REQUIRE_ESM` on 3.x and must stay on 2.x.
