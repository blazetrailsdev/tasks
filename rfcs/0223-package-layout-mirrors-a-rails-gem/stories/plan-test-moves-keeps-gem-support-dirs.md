---
title: "plan-test-moves keeps the gem's support dirs (activejob test/jobs, test/adapters)"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9918
claim: "2026-11-09T14:35:33Z"
assignee: "lib-test-layout-tooling-inventory-rest"
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/plan-test-moves.ts` sends every support file without a matching Rails
directory segment to `test/support/`. For activejob (trails#9877) that put
`lib/test-helpers/jobs/*.ts` at `packages/activejob/test/support/jobs/`,
`lib/test-helpers/adapters/*.ts` at `test/support/adapters/`, and
`lib/test-helpers/helper.ts` at `test/support/helper.ts`. The gem keeps them at
`vendor/rails/v8.0.2/activejob/test/jobs/`, `test/adapters/` and `test/helper.rb`. The
planner also sent actionview's `rails-dom-testing/assertions/selector-assertions.test.ts`
to `test/` instead of beside its sibling (fixed by hand in #9877), because
`PKG_SRC_DIRS["rails-dom-testing"]` is a sub-path of actionview's prefix.

## Acceptance criteria

- [ ] Support-file mapping strips the `test-helpers/` segment and keeps the gem's own
      directory (`jobs/`, `adapters/`, `models/`) when `vendor/rails/v8.0.2/<gem>/test/<dir>` exists;
      `helper.ts` maps to `test/helper.ts`.
- [ ] Rule 1 resolves aliased compare packages (`rails-dom-testing`) against their own
      `PKG_SRC_DIRS` prefix; a unit test covers it.
- [ ] activejob's `test/support/{jobs,adapters,helper.ts}` move to `test/jobs/`,
      `test/adapters/`, `test/helper.ts` with specifiers only; parity:test delta 0.
