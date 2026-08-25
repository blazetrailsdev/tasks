---
title: "buildArel's connection is never null — retire the sanitize_limit fallback ternary (query_methods.rb:1595,1757)"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6610
claim: "2026-08-16T20:13:32Z"
assignee: "collection-proxy-mutation-terminals-through-scope"
blocked-by: null
closed-reason: null
---

## Context

Rails' `build_arel` always has a connection — every call site acquires one
first:

- the `arel` reader is
  `@arel ||= with_connection { |c| build_arel(c, aliases) }`
  (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1595`)
- `update_all` / `delete_all` call `build_arel(c)` inside their own
  `model.with_connection` block
  (`vendor/rails/activerecord/lib/active_record/relation.rb:1023`)

so `arel.take(build_cast_value("LIMIT", connection.sanitize_limit(limit_value)))`
(`query_methods.rb:1757`) never has to consider a missing connection.

PR #6601 (`converge-build-arel-connection-threading`) made trails'
`buildArel` read its `connection` parameter, but it still carries a
fallback the Rails body does not have
(`packages/activerecord/src/relation/query-methods.ts`):

```ts
connection?.sanitizeLimit
  ? connection.sanitizeLimit(this.limitValue)
  : sanitizeLimit(this.limitValue);
```

and `toArel` threads `this._resolveAdapter()`, which returns null rather
than raising, because Arel building is reachable on a model with no
established pool (`_cteBodyArelNode`, `buildFrom`'s subquery path, and
several tests build Arel on connectionless models — `_conn()` raises
`ConnectionNotEstablished` there). trails has no `with_connection`
acquisition seam at the `arel` reader, so the null has to be tolerated
somewhere.

The standalone `sanitizeLimit` in
`connection-adapters/abstract/database-statements.ts` is itself a faithful
port of `sanitize_limit` (`abstract/database_statements.rb`) and is now
declared on the `AbstractAdapter` interface too — the deviation is the
CONDITIONAL, not the helper.

## Converged shape

Give `toArel` a real acquisition point so `connection` is never null and
the ternary collapses to `connection.sanitizeLimit(limitValue)`, matching
`query_methods.rb:1757` exactly. The options, in preference order:

1. Port `with_connection` at the `arel` reader as Rails has it at
   `query_methods.rb:1595`, so the connectionless callers acquire (or
   fail) at the same place Rails does.
2. If a genuinely connectionless Arel build must survive, make that
   explicit at the call site rather than degrading silently inside
   `buildArel` — the connectionless paths are `_cteBodyArelNode` and
   `buildFrom`'s subquery path.

Note `converge-build-arel-limit-offset-cast-value` (0107, in-progress)
touches the same line for `build_cast_value`; coordinate or sequence
behind it.

## Acceptance criteria

- [ ] `buildArel`'s limit line is `connection.sanitizeLimit(limitValue)`
      with no null-connection ternary.
- [ ] The Arel-building tests that run without an established connection
      still pass, or are converted to acquire a connection the way Rails
      does.
- [ ] `pnpm parity:api:calls` / `:args` clean.
