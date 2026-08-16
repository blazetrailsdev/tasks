---
title: "Converge limit! to Rails' bare assignment, dropping the eager validation"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6610
claim: "2026-08-16T20:13:32Z"
assignee: "collection-proxy-mutation-terminals-through-scope"
blocked-by: null
closed-reason: null
---

## Context

Rails' `limit!` is a bare assignment — no validation, no coercion:

```ruby
def limit!(value) # :nodoc:
  self.limit_value = value
  self
end
```

(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1215-1218`)

Coercion happens later and elsewhere: `build_arel` passes the stored value
through `connection.sanitize_limit` (`query_methods.rb:1757`), which is where
a non-integer is normalised or rejected.

trails' `limitBang` (`packages/activerecord/src/relation/query-methods.ts:1297-1308`)
instead validates eagerly and raises a bare `Error`:

```ts
function limitBang(this: QueryMethodsHost, value: number | null): any {
  if (value == null) {
    this.limitValue = null;
    return this;
  }
  const num = Number(value);
  if (!Number.isSafeInteger(num) || num < 0) {
    throw new Error(`Invalid limit value: ${String(value)}`);
  }
  this.limitValue = num;
  return this;
}
```

Three divergences in one body: an eager guard Rails does not have, a coercion
that belongs in `sanitize_limit`, and a raw `Error` rather than any Rails error
class (Rails raises nothing here at all).

This is the exact sibling of `offset!`, which PR #6602 converged — `offset!`
now stores the raw value and `build_arel` applies `offset_value.to_i`
(`query_methods.rb:1231-1234`, `:1758`). `limit!` was left alone in that PR to
keep it scoped to the story's LIMIT/OFFSET cast-value work; the story text
called it out as pre-existing and untouched.

Surfaced while landing `converge-build-arel-limit-offset-cast-value` (PR #6602).

## Acceptance criteria

- `limitBang` is `self.limit_value = value` (`query_methods.rb:1215-1218`) —
  no eager validation, no `Number()` coercion, no bare `Error`.
- The signature widens the way `offset!`'s did in #6602 (`number | string |
null`), through `limit()`, `limitValue` and the relation options type, since
  the value is now duck-typed until `sanitize_limit` sees it.
- Behaviour for a non-integer / negative limit is whatever
  `connection.sanitize_limit` produces (`abstract/database_statements.rb`), not
  a throw at assignment time. Check the existing trails tests that pin the
  current `Invalid limit value` throw and re-point them at the
  `sanitize_limit` outcome — read the Rails coverage first.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.
