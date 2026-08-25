---
title: "connection-handling.test.ts splits Rails' single ConnectionHandlingTest and hijacks Base's pool"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 5658
claim: "2026-07-30T18:35:16Z"
assignee: "converge-connection-handling-test-onto-one-rails-class"
blocked-by: null
closed-reason: null
---

## Context

Rails has ONE `ConnectionHandlingTest` class, declared with `fixtures :posts`
and riding the ambient pool `cases/helper.rb` established
(`vendor/rails/activerecord/test/cases/connection_handling_test.rb:7-16`). It
never establishes, removes, or swaps `ActiveRecord::Base`'s pool.

`packages/activerecord/src/connection-handling.test.ts` instead splits that
into five describes: a fixture-less `ConnectionHandlingTest` that
hand-establishes a pool from a captured `ambientDbConfig` in `beforeEach`, a
second `ConnectionHandlingTest` carrying the `fixtures(["posts"])` cases, and
three trails-only describes (`resolveConfigForConnection / connectsTo with
unset configurations`, `threadedConnectionFor pool-identity guard`,
`establish_connection accepts a DatabaseConfig`, `loadConfigFile resolves
config/database.*`) that hand `Base` a foreign pool or clear it outright.

PR #5415 made the worker pool live for the whole worker (Rails' connect-once
model), which exposed this: those describes leaked a `db/primary.sqlite3` pool
into whatever ran next, and the `fixtures(["posts"])` describe only worked
because the deleted `establishFromTestConfig` silently healed `Base`'s pool.
PR #5415 added a `restoreWorkerConnection()` (`Base.establishConnection("arunit")`
— `support/connection.rb:32`) to each such describe. That is a correct shield,
but the underlying split and the pool hijacking remain a trails invention.

## Acceptance criteria

- Collapse the two `ConnectionHandlingTest` describes into one carrying
  `fixtures(["posts"])`, matching `connection_handling_test.rb:7-16` — the
  fixture-less describe plus `ambientDbConfig`/`setupConnection` disappears.
- Establish whether the trails-only describes need to swap `Base`'s pool at
  all, or can drive a model/pool of their own; where they must, keep the
  restore and justify it at the call site.
- No test names change (`parity:test` matches on them).
- Delta on `parity:test` for this file is non-negative.
