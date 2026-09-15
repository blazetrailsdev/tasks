---
title: "port-test-fixtures-all-glob"
status: draft
updated: 2026-09-15
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-test-fixtures-concern-remainder` ported `ActiveRecord::TestFixtures::ClassMethods`
(`vendor/rails/activerecord/lib/active_record/test_fixtures.rb:43-95`) onto
`ClassMethods` in `packages/activerecord/src/test-fixtures.ts`, and the vitest
`fixtures()` helper now records names through `klass.fixtures(...)`. Still unported:

- the `fixtures :all` glob (`test_fixtures.rb:57-63`, `Dir[File.join(path, "{**,*}/*.{yml}")]`):
  the TS arm raises on blank `fixturePaths` and then yields no names
  (`@missingRailsCall Dir`). trails' corpus is TS modules in
  `test-helpers/fixtures/`; the glob needs an async fs walk over `fixturePaths`.
- `before_setup` / `after_teardown`, `setup_fixtures` / `teardown_fixtures`,
  `setup_transactional_fixtures` / `teardown_transactional_fixtures`,
  shared-pool setup, `fixture` / `active_record_fixture` / `access_fixture`
  (`test_fixtures.rb:9-18,97-321`). trails' equivalent machinery lives in
  `test-fixtures/with-transactional-fixtures.ts` under trails names and reads
  `usesTransaction` from an options array rather than `isUsesTransaction`.

## Acceptance criteria

- Port the `:all` arm's glob and drop the `@missingRailsCall Dir` tag.
- Rename/restructure `withTransactionalFixtures` onto `setupTransactionalFixtures` /
  `teardownTransactionalFixtures` driven by the per-suite TestFixtures class
  (`isUsesTransaction(name)`, `lockThreads`), then narrow or retire the
  `test_fixtures.rb` row in `scripts/parity/unported-files/unscoped.ts`.
