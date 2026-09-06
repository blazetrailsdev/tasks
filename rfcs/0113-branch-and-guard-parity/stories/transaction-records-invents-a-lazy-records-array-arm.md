---
title: "Transaction#records invents a lazy _records array arm"
status: draft
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7544, which cleared the `concat`-as-a-push-loop artefact from
this pair (audit row 31 of
`docs/infrastructure/arm-mismatch-noise-floor.md`). What is left is a real
invented arm, not a lowering artefact.

Rails (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:218-224`):

```ruby
def records
  if @lazy_enrollment_records
    @records.concat @lazy_enrollment_records.values
    @lazy_enrollment_records = nil
  end
  @records
end
```

trails (`packages/activerecord/src/connection-adapters/abstract/transaction.ts`,
`get records()`) adds a second arm inside the guard:

```ts
if (!this._records) this._records = [];
```

Rails has no such branch: `@records` is an Array by the time `records` runs —
`@records.concat` would raise on `nil` — so the lazy-init is a trails-only
nullability arm, and `records`' return type is `unknown[] | null` where Rails'
is always an Array.

Arms projection after #7544: Ruby `if loop ref:values`, TS `if if ... loop ...`
— one invented `if`.

## Converged shape

Initialize `_records` where Rails initializes `@records` (the transaction's own
constructor / `AbstractTransaction#initialize`), drop the lazy-init arm from
`get records()`, and narrow the getter's type to the non-null array so callers
stop guarding it.

## Acceptance criteria

1. `get records()` carries exactly Rails' one `if`, and its body is
   `if (this._lazyEnrollmentRecords) { …concat…; this._lazyEnrollmentRecords = null; } return this._records;`.
2. `_records` is never null after construction; the getter's declared type has
   no `| null`.
3. `pnpm parity:api:arms:report` no longer flags
   `activerecord/connection-adapters/abstract/transaction.ts#records`.
4. The transaction and callback suites pass on SQLite, PostgreSQL and MySQL.
