---
title: "lint-and-typedoc-read-esnext-temporal-lib"
status: in-progress
updated: 2026-11-20
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10430
claim: "2026-11-20T17:57:48Z"
assignee: "lint-and-typedoc-read-esnext-temporal-lib"
blocked-by: null
closed-reason: null
---

## Context

`date-drops-polyfill-types-for-native-temporal-lib` (0241) can delete `packages/date/lib/temporal.ts` and `@js-temporal/polyfill` only once the lint and typedoc toolchain can type-check against `ESNext.Temporal`. Today `.pnpmfile.cjs` (`TS5_PEER_CONSUMERS`) pins `typescript-eslint` / `@typescript-eslint/*` onto the `typescript-5` alias (5.9.3), and `packages/website/typedoc.config.mjs` runs on it too; `node_modules/typescript-5/lib` has no `lib.esnext.temporal.d.ts`. Setting the lib in the root tsconfig made typedoc fail with TS6046 and made ESLint flag the casts at `activesupport/lib/time-with-zone.ts:192` and `activestorage/lib/config/routes.ts:104,137` as unnecessary (trails#10390).

## Acceptance criteria

- typescript-eslint and typedoc resolve a TypeScript whose lib set includes `esnext.temporal` (a TS 5.x/6.x release that ships it, or a TS 7 API bridge), with `lib: [..., "ESNext.Temporal"]` in the root tsconfig.
- `pnpm lint` and the website typedoc build pass with that lib set and do not report the three casts above.
