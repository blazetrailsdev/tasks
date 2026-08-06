---
title: "make-version-gated-predicates-async"
status: ready
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

`database-version-sync-getter-forces-hand-warms` offered two shapes. PR #6149
implemented shape 2 (fill the memo by construction, at connection establishment)
and **proved it insufficient**. This story is shape 1, which that PR's evidence
shows is the only shape that actually closes the gap.

Shape 2 as shipped in #6149:

- `AbstractAdapter#configureConnection` (`abstract_adapter.rb:1212-1214`) fills
  `pool.serverVersion(this)` before `checkVersion()`.
- `PostgreSQLAdapter#_maybeConfigureConnection` fills its memo at the position
  Rails' `super` occupies (`postgresql_adapter.rb:957`).

That retired eleven hand-warms and is correct as far as it goes. It cannot cover
the case where **the first thing that happens to an adapter is a sync
version-gated read**, because the read is sync and the connect is async. Three
distinct instances were reproduced against a live MySQL 8.4.9:

1. `support/canonical-schema.ts` `prepareSchema` → `createTable` on a
   pool-provided but not-yet-connected adapter. (#6149 works around this by
   calling `verifyBang()` — Rails' `checkout` → `verify!`,
   `abstract_adapter.rb:759` — at that one entry point.)
2. `adapters/abstract-mysql-adapter/connection.test.ts:27` `clearVersionCache`
   nulls the memo in a blanket `afterEach`; `verifyBang()` short-circuits on a
   live connection and never re-configures, so every following test inherits a
   cold version. (#6149 refills it in that hook.)
3. `adapters/abstract-mysql-adapter/schema.test.ts:188` constructs a
   **standalone** `new Mysql2Adapter(...)` and calls `createTable` as its first
   operation. There is no connect event to hang a fill on. **This one has no
   workaround under shape 2** — it is why #6149 had to leave
   `MySQL::SchemaStatements#row_format_dynamic_by_default?` async.

Rails has none of these problems: `database_version`
(`abstract_adapter.rb:854-856`) is `pool.server_version(self)`, which issues the
round-trip — and therefore connects — on demand, from any state.

## Converged shape

Make the version-gated predicates async and await them at their call sites, so
`databaseVersion` can be fetched on demand exactly where Rails fetches it. The
blast radius is the point of the story: `supports_*?` is read from schema-creation
visitors (`mysql/schema-creation.ts` `quotedColumns` →
`supportsIndexSortOrder()`) and schema statements, both of which are currently
sync.

## Acceptance criteria

- [ ] `databaseVersion` is readable from a standalone, never-connected adapter,
      as Rails' `database_version` is — `schema.test.ts:188`'s ANSI_QUOTES
      adapter is the canary.
- [ ] `MySQL::SchemaStatements#row_format_dynamic_by_default?` converges to
      Rails' sync predicate (`mysql/schema_statements.rb:146-152`), along with
      `default_row_format` (`:154`); #6149 documents at that call site why it
      could not.
- [ ] The `verifyBang()` call #6149 added to `prepareSchema` and the memo refill
      it added to `connection.test.ts`'s `afterEach` are both removed — they are
      scaffolding for shape 2 and should not outlive it.
- [ ] All three lanes green, MariaDB included.
