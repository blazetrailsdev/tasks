---
title: "destroy-path-optimistic-lock-stale-check-affected-not-one"
status: done
updated: 2026-07-08
rfc: "0057-transaction-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: 4785
claim: "2026-07-08T12:51:54Z"
assignee: "destroy-path-optimistic-lock-stale-check-affected-not-one"
blocked-by: null
closed-reason: null
---

## Context

`base.ts:3926` (destroy path, `_destroyRow`) raises `StaleObjectError` only when
`affected === 0`:

```ts
const affected = await adapter.execDelete(deleteSql, `${ctor.name} Destroy`, deleteBinds);
if (ctor.lockingEnabled && affected === 0) {
  throw new StaleObjectError(this, "destroy");
}
```

Rails' `Locking::Optimistic#destroy_row`
(`vendor/rails/activerecord/lib/active_record/locking/optimistic.rb:123-131`)
raises whenever `affected_rows != 1`:

```ruby
def destroy_row
  affected_rows = super
  if locking_enabled? && affected_rows != 1
    raise ActiveRecord::StaleObjectError.new(self, "destroy")
  end
  affected_rows
end
```

This is the same divergence PR #4720 fixed on the UPDATE path
(`base.ts` `_performUpdate`, changed `affected === 0` → `affected !== 1` to
match `optimistic.rb:110`). The destroy path was flagged in that PR's review as
out of scope. In practice a PK-keyed single-row DELETE can only affect 0 or 1
rows, so this is low severity, but it is a literal divergence from the Rails
guard.

## Acceptance criteria

- [ ] `base.ts` destroy-path locking check raises on `affected !== 1`, matching
      `optimistic.rb:127-128`.
- [ ] Existing locking suite (`packages/activerecord/src/locking.test.ts`)
      stays green on sqlite and postgres.
- [ ] api:compare / test:compare delta non-negative.
