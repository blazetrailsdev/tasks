---
title: "Fix TransactionIsolationTest id-reflection race on PG/MariaDB (shared worker DB)"
status: done
updated: 2026-07-24
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: 5230
claim: "2026-07-24T15:42:55Z"
assignee: "fix-transaction-isolation-id-reflection-race"
blocked-by: null
closed-reason: null
---

# Fix TransactionIsolationTest id-reflection race on PG/MariaDB (shared worker DB)

## Context

`packages/activerecord/src/transaction-isolation.test.ts` (Rails:
`TransactionIsolationTest`) declares two models bound to the canonical `tags`
table, each with its own connection:

```ts
class Tag extends Base {
  static {
    this._tableName = "tags";
    this.attribute("name", "string");
  }
}
class Tag2 extends Base {
  static {
    this._tableName = "tags";
    this.attribute("name", "string");
  }
}
```

The subtests `read uncommitted` and `repeatable read` fail intermittently on
both PG and MariaDB with:

- `MissingAttributeError: can't write unknown attribute 'id'`, thrown from
  `Tag2.create({})` (`transaction-isolation.test.ts:91`) /
  `Tag.create({ name: "jon" })` — i.e. the model's attribute set knows only
  `name`, not the `id` PK the insert path tries to write.

Root-cause hypothesis: declaring `this.attribute("name", "string")` suppresses
DB column reflection (see the `attribute() kills reflection` invariant —
`project_declaring_attribute_suppresses_db_reflection`), so `id` is only known
if reflection populated it first. Under the shared per-worker DB the two
separately-connected `Tag`/`Tag2` models can race the `tags` schema
reflection / schema-cache warmth, so `id` is intermittently absent. With
`retry: 2` this passed on a later attempt once the cache warmed; at `retry: 0`
it surfaces.

Observed on CI run 30060420840 (PR #5205), jobs
`Active Record PostgreSQL Tests (2)` and `Active Record MariaDB Tests (2)` —
the first PG/MariaDB runs with the shared-DB retry removed.

Rails source of truth:
`vendor/rails/activerecord/test/cases/transaction_isolation_test.rb` — read it
before changing anything. `Tag`/`Tag2` mirror Rails' `establish_connection`
pattern. Fix the reflection race (e.g. ensure the `id`/PK column is reflected
for these connections before insert, matching how Rails' models pick up the
full `tags` schema) **without** weakening assertions, skipping subtests, or
renaming tests (names match Rails verbatim). `tags` is canonical — do not
convert it to a bespoke table.

## Acceptance criteria

- `transaction-isolation.test.ts` `read uncommitted` and `repeatable read`
  pass deterministically on PG and MariaDB with `retry: 0`, across repeated
  runs (no `MissingAttributeError: ... 'id'`).
- No assertion weakened, no subtest skipped, test names unchanged.
- SQLite lane stays green (these subtests skip on SQLite by design).
- Blocks story `remove-pg-mysql-test-retry-after-flake-burndown` (RFC 0028).
