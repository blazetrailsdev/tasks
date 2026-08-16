---
title: "converge-build-arel-connection-threading"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6601
claim: "2026-08-16T17:45:07Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

Rails threads the connection into `build_arel` at **every** call site:

- `Relation#arel` reader — `@arel ||= with_connection { |c| build_arel(c, aliases) }`
  (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1595`)
- `update_all` / `delete_all` — `build_arel(c)`
  (`vendor/rails/activerecord/lib/active_record/relation.rb:1023`)

and `build_arel` uses it: `arel.take(build_cast_value("LIMIT", connection.sanitize_limit(limit_value)))`
(`query_methods.rb:1757`).

trails' port (`packages/activerecord/src/relation/query-methods.ts` `buildArel`)
takes the parameter but names it `_connection` and never reads it — limit
sanitization goes through a standalone `sanitizeLimit` helper instead of
`connection.sanitize_limit`. Correspondingly `toArel` (`relation.ts`) calls
`this.buildArel(undefined, aliases)`.

PR #6593 converged the two `relation.rb:1023` sites to pass `this._conn()`, and
its review flagged the remaining asymmetry as a non-blocking follow-up.

Note the constraint that makes this non-trivial: `_conn()` raises
`ConnectionNotEstablished` on an unconnected model, and `toArel` /
`_cteBodyArelNode` / `buildFrom`'s subquery path are reachable without a live
connection (several tests build Arel on connectionless models). Threading
`_conn()` unconditionally at `toArel` would turn those into raises. Rails does
not have this problem because `with_connection` is the acquisition point.

## Acceptance criteria

- `buildArel` reads its `connection` parameter, using it for
  `connection.sanitize_limit(limit_value)` as `query_methods.rb:1757` does,
  and the parameter is named `connection` (not `_connection`).
- Every `buildArel` call site threads a connection, matching
  `query_methods.rb:1595` (`arel` reader) and `relation.rb:1023` — or the
  connectionless paths are handled the way Rails' `with_connection` does,
  justified at the call site.
- The standalone `sanitizeLimit` helper is either traced to its Rails
  counterpart (`sanitize_limit` lives on the adapter,
  `abstract/database_statements.rb`) or removed in favour of the adapter
  method.
- No connectionless-model regression: the Arel-building tests that run without
  an established connection still pass.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.
