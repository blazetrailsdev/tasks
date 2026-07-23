---
title: "attributes-own-table-descendant-under-sti-routes-to-base"
status: ready
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
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

Sibling of `load-schema-own-table-descendant-under-sti-loads-wrong-table`
(PR #5170), which gated the schema-LOAD path's `getStiBase` redirect on the
table actually being shared (`sharesStiBaseTable` / `stiSchemaHost` in
`packages/activerecord/src/model-schema.ts`).

`attributes.ts` still redirects on bare `isStiSubclass`:

- `defineAttribute` (packages/activerecord/src/attributes.ts:89): an
  `isStiSubclass(this)` check forwards the whole call to
  `getStiBase(this).defineAttribute(...)`.
- `defaultAttributes` (attributes.ts:183): `const cacheHost = stiSubclass ?
(getStiBase(this) as AnyClass) : this`.

For an own-table descendant under an STI ancestor (Shape → Circle → Ticket,
where Ticket sets its own `table_name = "tickets"`), `isStiSubclass(Ticket)` is
true, so `Ticket.attribute(...)` lands in Shape's `_attributeDefinitions` and
Ticket's default-attributes cache is keyed on Shape — even though #5170 now
reflects Ticket's own `tickets` columns onto Ticket.

## Acceptance criteria

- `attributes.ts` gates its `getStiBase` redirects the same way the load path
  does (shared-table only); export/share the `sharesStiBaseTable` predicate
  rather than re-deriving it.
- Regression test: an own-table descendant's `attribute()` declaration lands on
  the descendant, not the STI base, and does not appear on base/siblings.
- Genuine (shared-table) STI subclasses still route to the base — existing
  STI attribute/enum/encryption suites stay green.
