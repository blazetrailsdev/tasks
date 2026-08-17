---
title: "converge-lock-value-stores-locks-not-clause-string"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6672
claim: "2026-08-17T22:06:05Z"
assignee: "converge-lock-value-stores-locks-not-clause-string"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `locked?` onto the `lock_value` alias (relation.rb:75)
in PR #6624.

Rails' `lock!` (query_methods.rb:1242-1249) stores the argument itself:

```ruby
def lock!(locks = true)
  case locks
  when String, TrueClass, NilClass
    self.lock_value = locks || true
  else
    self.lock_value = false
  end
end
```

So a bare `lock` leaves `lock_value == true` and `lock(false)` leaves it
`false` — never `nil`. trails (`packages/activerecord/src/relation/query-methods.ts:1189-1191`)
instead normalizes to the clause string or `null`:

```ts
this.lockValue = locks; // String arm
this.lockValue = locks ? "FOR UPDATE" : null;
```

`lock_value` is typed `string | null` throughout as a result, `locked?` cannot
answer `true` the way Rails does, and `build_arel`'s
`arel.lock(lock_value)` (query_methods.rb, `if lock_value`) reads a value Rails
never stored. #6624 deliberately left this alone: it converged the two
predicates only, and the `true`/`false` flip touches `buildArel`, the value
accessor semantics tests and the merge folds.

## Acceptance criteria

- [ ] `lockBang` is query_methods.rb:1242-1249 — `lock_value = locks || true`
      for String/true/nil, `false` otherwise; no `"FOR UPDATE"` substitution at
      the writer.
- [ ] `lockValue`'s type widens to `string | boolean | null` and `isLocked`
      (relation.rb:75) answers it unchanged.
- [ ] `buildArel` supplies the adapter default clause where Rails does, so the
      emitted SQL is unchanged.
- [ ] `pnpm parity:api:calls` / `:args` clean; SQLite, PostgreSQL,
      MySQL/MariaDB green.
