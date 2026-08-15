---
title: "find_each/find_in_batches drop the no-block enumerator arm and its size lambda"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6574
claim: "2026-08-15T18:45:04Z"
assignee: "find-each-no-block-enumerator-size-arm"
blocked-by: null
closed-reason: null
---

# `find_each`/`find_in_batches` drop Rails' no-block enumerator arm and its size lambda

## Context

`vendor/rails/activerecord/lib/active_record/relation/batches.rb:85-96`:

```ruby
def find_each(start: nil, finish: nil, batch_size: 1000, error_on_ignore: nil, cursor: primary_key, order: DEFAULT_ORDER, &block)
  if block_given?
    find_in_batches(...) { |records| records.each(&block) }
  else
    enum_for(:find_each, ...) do
      relation = self
      cursor = Array(cursor)
      apply_limits(relation, cursor, start, finish, build_batch_orders(cursor, order)).size
    end
  end
end
```

and `batches.rb:161-168`, where `find_in_batches`'s `to_enum` block computes
`(total - 1).div(batch_size) + 1`.

`packages/activerecord/src/relation.ts`'s `findEach`/`findInBatches` are async
generators, so the `block_given?` split has no counterpart: there is one arm, and
`Enumerator#size` — the only consumer of those lambdas — has no async-iterator
equivalent, so `apply_limits` is never called from either method. That is the
whole content of the two `kind: "set"` rows
(`find_each`/`apply_limits`, `find_in_batches`/`apply_limits`) in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`, each
carrying a verified per-site reason from PR #6566.

Rails' `Enumerator#size` is observable — `Post.find_each.size` answers without
iterating — so this is a missing capability, not only a recorder artifact.

## Converged shape

Decide, and record the decision in code rather than in the ledger:

- either give the no-block arm a returned object carrying a `size` (a lazy
  enumerator shape with the `apply_limits(...).size` /
  `(total - 1).div(batch_size) + 1` computations spelled as Rails spells them),
  so both calls appear at the Rails call sites; or
- if an async iterator genuinely cannot carry it, `pnpm tasks block` with the
  specific blocker and move the reason onto a `@missingRailsCall` JSDoc tag at
  the call site, which is the sanctioned per-site form, retiring the two ledger
  rows.

Check `SKIP_GROUPS` in `scripts/parity/conventions.ts` first — Ruby
enumerator-returning arms may already have a disposition there.

## Acceptance criteria

- [ ] `findEach`/`findInBatches` either make Rails' `apply_limits` /
      `build_batch_orders` calls, or carry a reviewed `@missingRailsCall` at the
      site with the two ledger rows deleted.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:calls` green; batches suites green on SQLite, PG,
      MySQL/MariaDB.
