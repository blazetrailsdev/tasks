---
title: "route-through-collection-writes-onto-association-insert-record"
status: claimed
updated: 2026-07-24
rfc: "0005-activerecord-gaps"
cluster: null
deps:
  - share-collection-association-target-with-proxy
deps-rfc: []
est-loc: null
priority: 20
pr: null
claim: "2026-07-24T10:38:25Z"
assignee: "route-through-collection-writes-onto-association-insert-record"
blocked-by: null
closed-reason: null
---

# Route through-collection writes onto the Association object's insertRecord

## Context

Follow-up from `converge-push-through-onto-insert-record` (behavioral half
shipped there: `_pushThrough` now carries Rails' `record.new_record? ||
record.has_changes_to_save?` gate).

trails has two parallel implementations of through-collection writes:

- The OO association objects — `HasManyThroughAssociation#insertRecord` /
  `concatRecords` (`packages/activerecord/src/associations/has-many-through-association.ts:134`),
  faithful ports of `vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:23-49`.
  Reached only via `record.association("people").concat(...)`
  (`associations/instance-methods.ts:35`).
- The user-facing `CollectionProxy`, whose `push` / `append` / `appendBang` /
  `create` / `createBang` all funnel into `_pushThrough`
  (`associations/collection-proxy.ts:2255`), a ~200-line trails-invented
  reimplementation that resolves the through reflection, derives join
  attributes, and writes the join row itself. Rails has no `_pushThrough`:
  `CollectionProxy#<<` delegates to `proxy_association.concat(records)`.

The two worlds do not share state — `association()` (`associations.ts:3215`)
returns a `CollectionProxy` with its own `_target`, while
`_associationInstances` holds the `HasManyThroughAssociation`. So collapsing
`_pushThrough` onto `concatRecords` → `insertRecord` is not a local edit: it
requires the proxy and the association instance to share one target, which is
an architectural change well past the 500-LOC ceiling for a single story.

Audit of `_createThrough` (`collection-proxy.ts:1625`): it builds + saves the
target itself and then calls `_pushThrough`, so by then the record is persisted
and clean — no `has_changes_to_save?` gate divergence. Its divergence is purely
the same structural one (it does not reach `HasManyThroughAssociation#buildRecord`
/ `insertRecord`).

## Acceptance criteria

- [ ] `CollectionProxy` through-writes (`push`/`<<`/`append`/`appendBang`/
      `create`/`createBang`) reach `HasManyThroughAssociation#insertRecord` via
      `concatRecords`, with `_pushThrough` deleted or reduced to a thin shim.
- [ ] Proxy target and association target stay coherent after the reroute
      (loaded-ness, `_addToTarget` dedup, before/after_add callbacks).
- [ ] No regression in has_many_through / HABTM / nested-through / autosave suites.
- [ ] If the reroute cannot fit one PR, split it into ordered stories with the
      target-sharing prerequisite first.
