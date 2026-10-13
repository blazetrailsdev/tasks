---
title: "activerecord-test-fixtures-vitest-surface-leaves-rails-file"
status: claimed
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-13T22:54:26Z"
assignee: "activerecord-test-fixtures-vitest-surface-leaves-rails-file"
blocked-by: null
closed-reason: null
---

## Context

From trails PR 8857. `ActiveRecord::TestCase` (`vendor/rails/v8.0.2/activerecord/test/cases/test_case.rb:21`) is seated by
`packages/activerecord/src/cases/test-case.ts`, and its type reaches the `ActiveRecord` namespace through a module
augmentation of an empty exported `interface TestConstants {}` in `packages/activerecord/src/namespaces.ts`. Rails has
no such name. It exists because `namespaces.ts` cannot `import type` `cases/test-case.ts`: that file imports
`packages/activerecord/src/test-fixtures.ts` (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb`),
which also holds the vitest-facing `fixtures()` helper and its static import of
`test-helpers/fixtures-registry.ts`. The registry's `model: () => import("./models/...")` entries pull every canonical
test model into the Leaf Tests and Virtualized DX type programs (`pnpm test:types:virtualized` then fails in
`test-helpers/models/reply.ts`).

`fixtures()` and its types (`FixtureMap`, `UseFixturesResult`, `UseFixturesByNameResult`, `FixturesResult`,
`testCaseClassFor`, `registerFixtureHooks`, `resolveFixtureClassNames`) have no counterpart in `test_fixtures.rb`.
`fixtures` is imported from `test-fixtures.js` by 552 test files.

## Acceptance criteria

- [ ] `test-fixtures.ts` holds only what `test_fixtures.rb` defines and no longer imports the fixture registry; the
      vitest `fixtures()` surface lives in a module outside the Rails-mirrored file, and its importers are repointed.
- [ ] `namespaces.ts` declares `TestCase: typeof TestCase` through a plain `import type`, and `TestConstants` and the
      `declare module "../namespaces.js"` block in `cases/test-case.ts` are deleted.
- [ ] `pnpm test:types` and `pnpm test:types:virtualized` pass.
