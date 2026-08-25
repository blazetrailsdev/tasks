---
title: "ConnectionHandlerTest config-only database literals are trails inventions"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5715
claim: "2026-07-31T15:48:03Z"
assignee: "converge-connection-handler-test-config-literals-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

`ConnectionHandlerTest` in Rails builds its configs from real config values —
`{ "adapter" => "sqlite3", "database" => "test/db/primary.sqlite3" }` and
siblings `test/db/readonly.sqlite3`, `test/db/common.sqlite3`,
`test/db/bad-primary.sqlite3` (`vendor/rails/activerecord/test/cases/
connection_adapters/connection_handler_test.rb:38-45, 123, 141-146, 165-168,
184, 198-199, 214`), and its `setup` establishes the handler against the real
`:arunit` primary config (`:14`).

trails' port invented `dev.db`, `animals.db`, `dev-read.db`, `replica.db`,
`common.sqlite3` and friends. PR #5705 repointed only the six tests that
actually lease a connection at `ambientPoolConfiguration()` (they were
materializing `dev.db` in the repo root); ~19 config-only occurrences of the
invented names remain in `packages/activerecord/src/connection-adapters/
connection-handler.test.ts`.

Those are harmless today — they are never connected through, which is what
Rails does too — but the _values_ diverge from Rails, so a reader can't match
the trails test to its Rails counterpart by config, and a future test copied
from a neighbour inherits an invented name.

The same invented names appear in `connection-handling.test.ts`
(`db/common.sqlite3`, `db/foo.sqlite3`, `db/discrete.sqlite3`) and
`core.trails.test.ts` (`db/global.sqlite3`, `db/hijacked.sqlite3`); sweep them
in the same pass where a Rails counterpart exists.

## Acceptance criteria

- Config-only database literals in `connection-handler.test.ts` use Rails'
  verbatim values where the trails test maps to a Rails test.
- Tests with no Rails counterpart keep a name that cannot be connected through
  (or ride `ambientPoolConfiguration()` if they lease).
- Test names unchanged; `parity:test` for `connection_handler_test.rb` stays
  at 22/22.
- Suite run leaves `git status` clean.
