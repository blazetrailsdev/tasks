---
title: "Non-through CollectionProxy#destroy should resolve ids and raise on type mismatch"
status: in-progress
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4496
claim: "2026-07-03T17:09:52Z"
assignee: "collection-proxy-destroy-non-through-resolve-and-typecheck"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy#destroy` (`packages/activerecord/src/associations/collection-proxy.ts`,
non-through branch ~lines 2646-2664) reimplements destroy inline as
`for (const record of records) await record.destroy()`. Unlike the through/HABTM
branch — which delegates to `CollectionAssociation#destroy` → `deleteOrDestroy`
(`collection-association.ts:721-728`) and thus runs `coerceToRecords` +
`raiseOnTypeMismatchBang` — the inline non-through path:

- does NOT resolve id/string/bigint args to records (Rails' shared
  `delete_or_destroy` does: `collection_association.rb:387-389`), so a bare id
  throws `record.destroy is not a function` instead of `find`-ing the record;
- does NOT run `raise_on_type_mismatch!`, so a wrong-class record is not
  rejected with `ActiveRecord::AssociationTypeMismatch` before touching the DB.

Rails routes ALL of `CollectionProxy#destroy` through
`@association.destroy(*records)` → `delete_or_destroy`
(`active_record/associations/collection_proxy.rb`,
`collection_association.rb`). Surfaced during PR #4490 (HMT destroy-mismatch
un-skip); the through path was already correct so no test currently covers this
non-through gap.

## Acceptance criteria

- [ ] Non-through `CollectionProxy#destroy` delegates to (or mirrors)
      `deleteOrDestroy` so it resolves id/string args via `coerceToRecords` and
      runs `raiseOnTypeMismatchBang` before any DB write.
- [ ] Passing a bare id to a non-through `destroy` finds+destroys the record
      (no `record.destroy is not a function`).
- [ ] Passing a wrong-class record raises `AssociationTypeMismatch` with no
      side effects.
- [ ] Add a plain has_many (non-through) destroy test only if a matching Rails
      test name exists; otherwise cover via existing suites — do not invent a
      test name.
- [ ] No regressions in has-many / HABTM / has-many-through destroy suites.
