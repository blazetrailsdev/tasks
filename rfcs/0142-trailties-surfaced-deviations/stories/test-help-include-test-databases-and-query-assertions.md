---
title: "test_help: include TestDatabases and QueryAssertions as modules"
status: done
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: trails#8157
claim: "2026-09-26T18:42:05Z"
assignee: "port-mapping-initialize-and-make-route"
blocked-by: null
closed-reason: null
---

## Context

`railties/lib/rails/test_help.rb:17,19` includes `ActiveRecord::TestDatabases`
and `ActiveRecord::Assertions::QueryAssertions` into `ActiveSupport::TestCase`
from the `active_support_test_case` load hook. trails#8098's
`packages/trailties/src/test-help.ts` includes only `TestFixtures`, because
both are ported as free functions rather than modules:

- `packages/activerecord/src/test-databases.ts` exports
  `createAndLoadSchema`, where Rails' `ActiveRecord::TestDatabases`
  (`activerecord/lib/active_record/test_databases.rb`) is a module that
  registers a `Parallelization.after_fork_hook` at load and defines
  `self.create_and_load_schema`.
- `packages/activerecord/src/testing/query-assertions.ts` exports
  `assertQueriesCount` / `assertNoQueries` / `assertQueriesMatch` /
  `assertNoQueriesMatch`, where Rails'
  `activerecord/lib/active_record/testing/query_assertions.rb` is
  `module ActiveRecord::Assertions::QueryAssertions`.

## Acceptance criteria

- `QueryAssertions` is an includable module (instance methods via
  `include()` / `Included<>`), and `test-help.ts` includes it in the
  `active_support_test_case` hook (`test_help.rb:19`).
- `TestDatabases` is a module whose load registers the after-fork hook where
  trails has one, and `test-help.ts` includes it (`test_help.rb:17`).
