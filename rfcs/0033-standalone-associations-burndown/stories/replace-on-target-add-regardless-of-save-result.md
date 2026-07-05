---
title: "replace_on_target should buffer record into target regardless of insert_record result (drop save-success gate)"
status: ready
updated: 2026-07-05
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Modern Rails `replace_on_target` (vendor/rails/.../collection_association.rb:457-483)
adds the record to `@target` and fires `after_add` **regardless of the insert
result** — the `yield(record)` at line 470 (where `insert_record` runs) has its
return value ignored; only a `before_add` `throw :abort` (the
`catch(:abort) { callback(:before_add) } || return` at 462-464) skips the add.

trails diverges: `CollectionProxy#_addToTarget`
(packages/activerecord/src/associations/collection-proxy.ts) does
`if (save && !(await save())) return record;` — when the insert's `save` returns
false the record is NOT committed to the target and `after_add` does not fire.
A code comment there explains the gate was added because "trails' create has no
transaction yet ... so we gate the in-memory push on save success." That premise
is now partly stale for the push/concat path: PR #4288 + #4308 wrap the persisted
concat in a transaction, so a mid-batch failure already rolls back. The OO
`replaceOnTarget` (collection-association.ts) likewise pushes only via the same
funnel and should be audited against Rails' add-regardless semantics.

## Acceptance criteria

- Audit + converge `_addToTarget` / `replaceOnTarget` to Rails' semantics: a
  record whose `insert_record` returns false (non-raising) is still added to the
  in-memory target and `after_add` fires, matching `replace_on_target`
  (yield return ignored).
- Verify the transaction wrap on the persisted concat path makes the
  save-success gate unnecessary; document any case (e.g. `create` without a
  transaction) that must keep the gate, or converge it too.
- Existing has-many / through / habtm push/concat/create tests stay green; add
  coverage for "failed save still buffers record in target" if Rails has a
  matching test.
