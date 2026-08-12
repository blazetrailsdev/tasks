---
title: "converge-pg-supports-optimizer-hints-memo"
status: done
updated: 2026-08-12
rfc: "0102-adapter-version-reader-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6436
claim: "2026-08-12T19:56:51Z"
assignee: "converge-pg-supports-optimizer-hints-memo"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while reviewing trails PR #6237 (`retire-pg-database-version-override`),
which made `PostgreSQLAdapter#getDatabaseVersion()` the pure fetch Rails has
(`postgresql_adapter.rb:634-643`). One non-Rails block survived inside it and is
now the only thing in that method Rails does not do.

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`,
`getDatabaseVersion()` — after the version probe, the body eagerly fills
`_hasOptimizerHints` with

    SELECT COUNT(*) AS count FROM pg_available_extensions WHERE name = 'pg_hint_plan'

swallowing every error into `false`, and `supportsOptimizerHints()` is a bare
`return this._hasOptimizerHints ?? false`.

Rails has neither the eager fill nor the swallow. `supports_optimizer_hints?`
(`postgresql_adapter.rb:444-449`) memoizes itself on first call:

    def supports_optimizer_hints?
      unless defined?(@has_pg_hint_plan)
        @has_pg_hint_plan = extension_available?("pg_hint_plan")
      end
      @has_pg_hint_plan
    end

and reaches the answer through `extension_available?`
(`postgresql/schema_statements.rb`), not a hand-written `pg_available_extensions`
count issued on a raw client.

Two consequences of the current shape:

1. The probe is coupled to the version fetch. Now that the version is memoized on
   the pool (`pool_config.rb:39-41`), `getDatabaseVersion()` runs once per pool, so
   `supportsOptimizerHints()` silently depends on that one call having happened.
2. The bare `catch → false` means a genuine connection failure reads as "the
   extension is absent", where Rails would propagate.

## Acceptance criteria

- [ ] `supportsOptimizerHints()` is self-memoizing, matching
      `postgresql_adapter.rb:444-449`, and routes through `extensionAvailable()`
      (`postgresql/schema_statements.rb`) rather than a hand-rolled
      `pg_available_extensions` count.
- [ ] The eager fill and the `catch → false` swallow are gone from
      `getDatabaseVersion()`, leaving it the pure fetch of
      `postgresql_adapter.rb:634-643`.
- [ ] `_hasOptimizerHints` follows Rails' `@has_pg_hint_plan` naming/lifetime.
- [ ] pg lane green.
