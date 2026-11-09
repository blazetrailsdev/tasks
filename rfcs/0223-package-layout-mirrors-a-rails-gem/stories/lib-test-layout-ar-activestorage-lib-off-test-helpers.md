---
title: "lib-test-layout-ar-activestorage-lib-off-test-helpers"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9916
claim: "2026-11-09T13:20:31Z"
assignee: "port-help-and-version-commands-for-split-namespace"
blocked-by: null
closed-reason: null
---

## Context

trails#9759 excluded colocated tests and `src/test-helpers` from every package's
published build, except `activerecord` and `activestorage`, whose library code
reaches their test helpers, so 405 AR helper modules (and activestorage's) still
compile into `dist/`. Blocking imports:

- `packages/activerecord/src/support/connection.ts` → `test-helpers/models/arunit2-model`
- `packages/activerecord/src/support/drop-all-tables.ts` → `test-helpers/test-schema`
- `packages/activerecord/src/support/setup-second-pool.ts` → `test-helpers/models/{course,college,entrant,professor}`
- `packages/activerecord/src/cases/helper.ts` → `test-helpers/use-fixtures`
- `src/support` / `src/cases` are reached from library files (`base.ts`,
  `test-fixtures.ts`, `test-adapter.ts`, `relation.ts`, …) via
  `./cases/test-case.js` / `./support/connection.js`.
- `packages/activestorage/src/service/shared-service-tests.ts` → `test-helpers/database/setup`

Rails keeps these in `activerecord/test/` (`test/cases/helper.rb`,
`test/support/connection.rb`), never in `lib/`.

## Acceptance criteria

- [ ] No library module in activerecord or activestorage imports a test-only helper.
- [ ] Both packages' `tsconfig.json` exclude `src/test-helpers`, and their
      `tsconfig.test.json` include it.
- [ ] After `pnpm build`, neither `packages/activerecord/dist` nor
      `packages/activestorage/dist` contains a `test-helpers` module.
