---
title: "activerecord: test-fixtures.ts drops the FixtureSet re-export and seats FixtureSetAccessor outside the Rails file"
status: claimed
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-14T11:42:29Z"
assignee: "dirty-getters-with-side-effects-exclusion-has-no-receipt"
blocked-by: null
closed-reason: null
---

## Context

Left over from trails#8878, which moved the vitest `fixtures()` surface out of
`packages/activerecord/src/test-fixtures.ts` into `test-helpers/use-fixtures.ts`.
Two exports remain in `test-fixtures.ts` that
`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb` does not define:

- `export { FixtureSet } from "./fixtures.js";` — a re-export. Rails'
  `test_fixtures.rb` only references `ActiveRecord::FixtureSet`
  (`test_fixtures.rb:194`, `:209`, `:271-292`); the constant is defined in
  `activerecord/lib/active_record/fixtures.rb`. After #8878 no file in
  `packages/` imports `FixtureSet` through `test-fixtures.js` (the three test
  files that import `TestFixtures` take `FixtureSet` from `./fixtures.js`).
- `export type FixtureSetAccessor<T>` — the call signature of the accessor
  `method_missing` answers (`test_fixtures.rb:294-300`). Rails has no named
  type. It is imported from the published subpath
  `@blazetrails/activerecord/test-fixtures` by
  `packages/trailties/src/generators/test-unit/scaffold/templates.ts:13`
  (emitted into generated functional tests as
  `declare <fixture>: FixtureSetAccessor<Model>`) and by
  `packages/trailties/src/boot-app-test-help.trails.test.ts:5`.

The module-private `deferConnectionPoolPin` / `settlePendingPins` helpers in the
same file are not part of this story: they serve the async pin in
`setup_transactional_fixtures` (`test_fixtures.rb:204-229`).

## Acceptance criteria

- [ ] The `FixtureSet` re-export is deleted from `test-fixtures.ts`, and any
      importer takes `FixtureSet` from `fixtures.ts`.
- [ ] `FixtureSetAccessor` either carries a `@noRailsEquivalent` receipt at its
      declaration or moves to a module outside the Rails-mirrored file, with the
      trailties generator template and its tests updated to the new import path.
- [ ] `pnpm parity:api:extra --package activerecord` lists nothing for
      `test-fixtures.ts`, and `pnpm typecheck`, `pnpm test:types` and
      `pnpm test:types:virtualized` pass.
