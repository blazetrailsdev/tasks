---
title: "port-test-fixtures-transactional-setup"
status: ready
updated: 2026-09-22
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 45
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `port-test-fixtures-all-glob` (the `fixtures :all` glob shipped there; this half did not fit the PR ceiling).

Still unported from `vendor/rails/activerecord/lib/active_record/test_fixtures.rb`:
`before_setup` / `after_teardown`, `setup_fixtures` / `teardown_fixtures`,
`setup_transactional_fixtures` / `teardown_transactional_fixtures`, shared-pool setup,
`fixture` / `active_record_fixture` / `access_fixture` (`test_fixtures.rb:9-18,97-321`).

trails' equivalent machinery lives in `packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`
under trails names, and `loadFixturesOnce` in `packages/activerecord/src/test-fixtures.ts` reads
`usesTransaction` from an options array rather than the per-suite class's `isUsesTransaction(name)`.

## Acceptance criteria

- Rename/restructure `withTransactionalFixtures` onto `setupTransactionalFixtures` /
  `teardownTransactionalFixtures`, driven by the per-suite TestFixtures class
  (`isUsesTransaction(name)`, `lockThreads`).
- Narrow or retire the `test_fixtures.rb` row in `scripts/parity/unported-files/unscoped.ts`.
