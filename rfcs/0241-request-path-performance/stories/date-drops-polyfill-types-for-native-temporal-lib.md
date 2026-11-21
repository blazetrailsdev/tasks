---
title: "date drops the polyfill's types once lint and typedoc read esnext.temporal"
status: done
updated: 2026-11-21
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps:
  - lint-and-typedoc-read-esnext-temporal-lib
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10509
claim: "2026-11-21T16:45:30Z"
assignee: "date-drops-polyfill-types-for-native-temporal-lib"
blocked-by: null
closed-reason: null
---

## Context

trails#10390 moved `@blazetrails/date` onto the native `globalThis.Temporal` at run time. `packages/date/lib/temporal.ts` exports it as a module-scoped `const Temporal`, typed from `@js-temporal/polyfill`'s declarations through an `import type`, plus a type namespace behind `// eslint-disable-next-line @typescript-eslint/no-namespace`. The polyfill stays in `packages/date/package.json` `dependencies` for its `.d.ts` only. The reason: native Temporal types exist only in TS 7's `esnext.temporal` lib, and the lint (`typescript-eslint`) and typedoc (`packages/website/typedoc.config.mjs`) toolchain runs on `typescript-5` (5.9.3), which has no such lib. With the lib set in the root tsconfig, typedoc failed with TS6046, and ESLint misread three casts as unnecessary: `activesupport/lib/time-with-zone.ts:192` and `activestorage/lib/config/routes.ts:104,137`. Related: `temporal-polyfill-runtime-native-preference` (0100, bundle and install size).

## Acceptance criteria

- Once the lint and typedoc toolchain can read `esnext.temporal`, `packages/date/lib/temporal.ts` is deleted, `Temporal` is the global (`lib: [..., "ESNext.Temporal"]`), and `@js-temporal/polyfill` leaves `packages/date/package.json`.
- The `no-namespace` disable goes with the file.
