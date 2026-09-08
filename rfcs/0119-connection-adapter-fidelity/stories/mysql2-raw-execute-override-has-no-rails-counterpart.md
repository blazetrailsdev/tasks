---
title: "Mysql2Adapter#rawExecute is an override Rails does not have, holding mysqlQuote and FK enrichment"
status: draft
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' mysql2 adapter overrides `perform_query`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2/database_statements.rb:41`)
and nothing else in the `execute` → `internal_execute` → `raw_execute` chain;
`grep -n "def raw_execute" vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2/`
finds nothing.

The PR for `execute-duplicated-on-adapters-and-wired-per-adapter` deleted
`Mysql2Adapter#execute`'s open-coded copy of `raw_execute` and routed it through
the inherited (query-cache-wrapped) `execute`. The two pieces of mysql2
specialisation that body carried had to land somewhere in the chain, and both
have to sit OUTSIDE `with_raw_connection`:

- `mysqlQuote(sql)` — trails emits `"`-quoted identifiers from Arel and rewrites
  them to backticks per adapter.
- `_translateAndEnrich` — `MismatchedForeignKey` enrichment issues its own query,
  so it cannot run inside `withRawConnection`'s `lock.synchronize` without
  re-entering the lock.

`perform_query` is inside that lock, so the specialisation went into a
`rawExecute` override on `Mysql2Adapter`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`), carrying
`@noRailsEquivalent CONVERGEABLE <this story>`.

## Acceptance criteria

- [ ] Either the `rawExecute` override is gone — with `mysqlQuote` and the
      `MismatchedForeignKey` enrichment relocated to seams Rails has (the
      enrichment's re-entrancy constraint measured, not assumed) — or the
      constraint is written up as the reason it cannot be.
- [ ] The four other `mysqlQuote(sql)` + `_translateAndEnrich` call sites in
      `mysql2-adapter.ts` (`internalExecQuery`, `executeMutation`, and the two
      below them) are folded into whatever the answer is, rather than left as
      five copies.
- [ ] MySQL and MariaDB lanes green; `pnpm parity:api:extra:gate` does not grow.
