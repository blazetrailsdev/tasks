---
title: "Route drift.ts and schema-compare test vendor paths through vendor/sources.ts"
status: closed
updated: 2026-09-27
rfc: "0159-versioned-vendor-layout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'Premise gone, delivered by trails#8105 (aa0d1b49f6). On origin/main, scripts/api-compare/drift.ts:143 is ''const baseSource = vendoredRoot(RAILS!.name)'', and scripts/schema-compare/compare.test.ts:541 now reads the versioned ''vendor/rails/v8.0.2/activerecord/test/schema/schema.rb'', so neither breaks at the depth change. That literal is a tracked citation-shaped path that pnpm vendor:recite rewrites at every bump (compare.test.ts is not in EXCLUDED), the same as ar-closure.test.ts and the other versioned literals in scripts/. git grep ''vendor/rails"'' -- scripts eslint returns nothing, which meets the RFC''s Verification bullet.'
---

## Context

`route-vendor-path-construction-through-sources-ts` (trails#8100) routed the twelve
listed call sites through `vendor/sources.ts`, but two more sites rebuild a
vendored path from a literal and were not on its list:

- `scripts/api-compare/drift.ts:143` — `gemListDelta`'s
  `join(ROOT, "vendor", RAILS!.name)` is a second spelling of
  `vendoredRoot("rails")` (`vendor/sources.ts`).
- `scripts/schema-compare/compare.test.ts:541` —
  `new URL("../../vendor/rails/activerecord/test/schema/schema.rb", import.meta.url)`
  is `resolveSourcePath("rails", "activerecord/test/schema/schema.rb")`.

Both break once the clone root gains a version segment
(`nest-vendored-clones-under-a-version-directory`), the same reason Phase 0
exists.

`scripts/parity/legacy-script-names.ts:91` (`path.join("vendor", "rails")` in
`SKIPPED_PATHS`) does not depend on path depth: it is a prefix skip, and
`vendor/rails/<ver>/…` is still under it. It is out of scope here.

## Acceptance criteria

- `drift.ts`'s `gemListDelta` reads the base clone through `vendoredRoot("rails")`.
- `compare.test.ts` reads `schema.rb` through `resolveSourcePath`.
- `pnpm parity:api:drift --ref <ref>` and `scripts/schema-compare/compare.test.ts`
  produce the same output as before.
