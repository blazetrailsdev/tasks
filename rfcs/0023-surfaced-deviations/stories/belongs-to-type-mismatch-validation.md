---
title: "belongs_to: AssociationTypeMismatch not raised on wrong-type assignment"
status: done
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4271
claim: "2026-06-29T13:22:11Z"
assignee: "belongs-to-type-mismatch-validation"
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/associations/belongs_to_associations_test.rb` — `test_type_mismatch` and `test_raises_type_mismatch_with_namespaced_class`: Rails raises `ActiveRecord::AssociationTypeMismatch` when assigning a record of the wrong type to a `belongs_to` association (e.g., assigning a `Post` to `client.firm`). Trails does not validate the assigned record's type. Surfaced in PR #4209 (both tests marked `.todo`).

Trails source: `packages/activerecord/src/associations/belongs-to-association.ts` — the setter does not check `record.isA?(reflection.klass)`.

## Acceptance criteria

- Assigning a record of the wrong class to a `belongs_to` raises an error equivalent to `AssociationTypeMismatch`.
- `type mismatch` and `raises type mismatch with namespaced class` tests pass (un-todo).
