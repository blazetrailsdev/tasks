---
title: "coerce-to-records-through-branch-raises-bare-error"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
deps: []
deps-rfc: []
est-loc: 60
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CollectionAssociation#coerceToRecords`
(`packages/activerecord/src/associations/collection-association.ts:1045`),
which ports Rails' `delete_or_destroy` id coercion, raises a bare
`new Error("Couldn't find <Model> with ID <id>")` in its through-association
branch:

```ts
const found = target.find((r) => String(this.primaryKeyValue(r)) === String(id));
if (!found) throw new Error(`Couldn't find ${this.klass.name} with ID ${String(id)}`);
```

Rails resolves the same ids through the scoped `find`
(`collection_association.rb:280-284` → `find`), which raises
`ActiveRecord::RecordNotFound` via
`scope.raise_record_not_found_exception!` with the model name, primary key,
id payload, and the scope's conditions. So `things.delete(missing_id)` on a
through association surfaces a plain `Error` with a non-Rails message and no
`model` / `primaryKey` / `id` fields — code rescuing `RecordNotFound` misses
it entirely.

Found while converging the sibling not-found path in PR #5875, which fixed
`CollectionAssociation#find` itself (`findByScan` no longer raises; `find`
does the size check and routes through `raiseRecordNotFoundExceptionBang`).
This through branch was left alone because it is a deliberate trails
work-around — the inline comment notes trails' `scope()`-based `find` cannot
query across the join, so it scans the loaded target instead — and swapping
its error type is a separate decision from the scan-vs-query divergence.

Note the branch also compares keys with a bare `String(...)`, where the
converged `findByScan` now uses `String(normalizeAssociationKey(...))` to fold
a BigInt PK (int8 under PG bigserial) against a number id.

## Acceptance criteria

- The through branch raises `RecordNotFound` with Rails' message shape,
  model name, primary key, and id — ideally by routing through the same
  `raiseRecordNotFoundExceptionBang` the non-through path now uses, rather
  than by hand-building a second message.
- Key comparison folds through `normalizeAssociationKey`, matching
  `findByScan`.
- Regression test fails on baseline: `things.delete(<missing id>)` on a
  has_many :through raises `RecordNotFound`, not `Error`. Check
  `vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`
  for an existing Rails test to port before writing a trails-only one.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
