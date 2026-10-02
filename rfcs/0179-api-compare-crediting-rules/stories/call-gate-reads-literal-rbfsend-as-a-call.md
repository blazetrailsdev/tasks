---
title: "parity: the call gate credits rbFSend / rbFPublicSend with a literal mid as a call to that name"
status: draft
updated: 2026-10-01
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8343. `DisableJoinsAssociationRelation#first`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/disable_joins_association_relation.rb:17-23`)
calls `records.limit(limit).first`. `records` is an Array, which has no `limit`, so the arm raises
`NoMethodError`. trails ports the call as `rbFSend(records, "limit", limit)`
(`packages/activerecord/src/disable-joins-association-relation.ts`) so the same `NoMethodError` is
raised.

The call gate (`scripts/api-compare/`, `pnpm parity:api:calls`) does not read
`rbFSend(recv, "limit", …)` as a call to `limit`, so the method carries
`@missingRailsCall limit — PERMANENT` for a call it does make.

## Converged shape

The TS call extractor records `rbFSend(recv, "<mid>", …)` and `rbFPublicSend(recv, "<mid>", …)`
with a string-literal `mid` as a call to `<mid>`, as Ruby's extractor records `recv.<mid>`. The
receipt on `DisableJoinsAssociationRelation#first` is then deleted.

## Acceptance criteria

- [ ] A literal-`mid` `rbFSend` / `rbFPublicSend` is credited as a call to that name.
- [ ] `DisableJoinsAssociationRelation#first` carries no `@missingRailsCall limit`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:receipts:gate` stay green.
