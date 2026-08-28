---
title: "select_all's preparable falls back to a bind count where Rails reads Arel's collector flag"
status: done
updated: 2026-08-28
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7152
claim: "2026-08-28T11:40:17Z"
assignee: "abstract-quote-default-expression-has-non-rails-undefined-and-proc-arms"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `mysql2-raw-execute-preparable-is-a-bind-count-approximation` (PR
#7121), which deleted the bind-count stand-in for Arel's `preparable` flag from
mysql2's `perform_query`. The SAME approximation survives one level up, at the
`to_sql_and_binds` position itself.

`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1374-1380`:

```ts
// Callers that don't supply opts.preparable fall back to bind presence, which
// is correct for every shape that carries binds.
const preparable = compiledPreparable ?? (binds != null && binds.length > 0);
const prepare = !!(this.preparedStatements && preparable);
```

Rails has no such fallback. `select_all` reads the flag Arel's collector set
while the statement was built:

```ruby
def to_sql_and_binds(arel_or_sql_string, binds = [], preparable = nil, allow_retry = false)
  ...
  prepare: prepared_statements && preparable,
```

(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:74`.)
`preparable` is `Arel::Collectors::Composite`/`Bind`'s flag — "was this SQL
produced through Arel with real bind params" — not "does it carry binds". A
hand-built SQL string with binds is preparable-false in Rails and true here, so
trails can prepare a statement Rails would not.

Do not resolve this by widening the comment. PR #7121 established the shape at
the mysql2 leaf; this is the same divergence at its source.

## Converged shape

Thread the collector's `preparable` flag through `compile` → `_compileSelectSql`
→ `opts.preparable` for every caller, so `compiledPreparable` is never null and
the `??` fallback has nothing to catch. Then delete the fallback, leaving
`prepared_statements && preparable` exactly as rb:74 spells it.

If a specific caller genuinely cannot produce the flag, fix that caller's
compile path rather than approximating from the bind count.

## Acceptance criteria

- [ ] `compiledPreparable ?? (binds != null && binds.length > 0)` is deleted;
      `preparable` comes only from the Arel collector.
- [ ] Callers that reach `toSqlAndBinds` without a `preparable` are converged to
      supply it.
- [ ] parity:api / parity:test delta non-negative; all three lanes green.
