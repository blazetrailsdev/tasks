---
title: "layout-package-roots-named-exports-under-tsx-eval"
status: in-progress
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9913
claim: "2026-11-09T13:05:48Z"
assignee: "create-table-migration-template-inlines-its-body"
blocked-by: null
closed-reason: null
---

# package-roots.ts loads with named exports under tsx -e

## Context

`pnpm parity:api:sends` and `pnpm parity:import-cycles` run as
`tsx -e "import('./scripts/parity/<x>.ts').then((m) => m.main())"`. On
trails#9794, `import { libRoot } from "../layout/package-roots.js"` in
`scripts/parity/send-count.ts` failed with "does not provide an export named
'libRoot'". Under `tsx -e`, `package-roots.ts` (no imports, only exports) is
detected as CommonJS (`Object.keys(m)` is `['default', 'module.exports']`),
while `send-count.ts` (uses `import.meta.url`) loads as ESM. So:

- `send-count.ts`'s `followLibRoot(base, current)` infers the lib packages from
  the current counts instead of calling `libRoot(pkg)`.
- `scripts/parity/import-cycles.ts` `measureEdges` / `makeResolver` probe both
  `lib` and `src` instead of `libRoot(pkg)`.
- `packages/trailties/src/production-boot.trails.test.ts:31` and
  `packages/activesupport/src/cache/file-store-lock-worker-hooks.trails.mjs`
  probe `lib` then `src`.

Four sites pick a library root by probing instead of reading the one table.

## Acceptance criteria

- [ ] `package-roots.ts` loads as ESM under `tsx -e` (e.g. it gains a real
      ESM marker such as an `import.meta` read or a type-only import, or the
      `parity:*` scripts move to `tsx <file>`). A test imports it through
      `tsx -e` and reads `libRoot`.
- [ ] `followLibRoot` and the import-cycles scan/resolver call `libRoot(pkg)`;
      their probes are deleted. `send-count.test.ts` / `import-cycles.test.ts`
      stay green.
- [ ] The two test-side probes are left alone, with a note in the
      `lib-test-layout-retire-src-compat` story to delete them when the `src`
      arm goes.
