---
title: "converge-push-through-onto-insert-record"
status: ready
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while fixing `has-changes-to-save-getter-called-as-method` (PR pending).

`HasManyThroughAssociation#insertRecord`
(`packages/activerecord/src/associations/has-many-through-association.ts:134`)
is a faithful port of Rails' `has_many_through_association.rb:23-33`, including
the `record.new_record? || record.has_changes_to_save?` gate that saves a
persisted-but-dirty target before the join row is written.

It is unreachable from the user-facing collection API. `CollectionProxy#push`
(`collection-proxy.ts:1959-1966`) branches on `this._assocDef.options.through`
and dispatches to `_pushThrough` (`collection-proxy.ts:2221`), a large
trails-invented reimplementation that resolves the through reflection, derives
join attributes, and writes the join row itself — it never calls the
association's `insertRecord`, and carries no `new_record? ||
has_changes_to_save?` gate at all.

Consequence: `post.people.push(dirtyPersistedPerson)` silently discards the
target's unsaved changes, while
`post.association("people").concat([dirtyPersistedPerson])` saves them. Verified
by probe on the getter-fix branch: the same assertion passes via `concat` and
fails via `push` with `expected 'Michael' to be 'Bongo'`.

Rails has no `_pushThrough`. `CollectionProxy#<<`/`push` delegates to
`proxy_association.concat(records)`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb`),
which reaches `insert_record` through `concat_records` — one code path for both
entry points. `_createThrough` (`collection-proxy.ts:1591`) looks like the same
class of divergence and should be checked alongside it.

The getter-fix PR pins the gate through the `concat` path, since that is the
path that actually reaches the fixed code. It deliberately did NOT converge
`_pushThrough` — that is this story.

## Acceptance criteria

- [ ] `CollectionProxy#push` / `<<` / `append` for a through association route
      through the association's `concatRecords` → `insertRecord`, matching
      Rails' single path, rather than `_pushThrough`.
- [ ] `post.people.push(persistedDirtyRecord)` saves the target's pending
      changes — add a test asserting the value survives `reload()`, mirroring
      the `concat` test added in the getter-fix PR
      (`has-many-through-associations.test.ts`, "associating a persisted record
      with unsaved changes saves those changes").
- [ ] Audit `_createThrough` for the same divergence; converge it or register a
      follow-up story with the findings.
- [ ] No regression in the has_many_through / HABTM / nested-through / autosave
      suites.
