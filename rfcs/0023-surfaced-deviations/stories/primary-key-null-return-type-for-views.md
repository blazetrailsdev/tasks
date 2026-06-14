---
title: "primary_key return type omits null for key-less data sources (views)"
status: ready
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3236 (f9g3b view primary-key detection, RFC 0016). Rails'
`primary_key` returns `nil` for a key-less data source (a view); our
`getPrimaryKeyAttr` (`attribute-methods/primary-key.ts`) returns `null` at
runtime for that case but is declared `string | string[]`, and `Base.primaryKey`
is likewise typed non-null. The `null` is currently passed through with an
`as string | string[]` cast.

This is a deliberate, accepted deviation (PR #3236 review thread): widening the
public type to `string | string[] | null` cascades to every model-typed `this`
host (`PersistenceHost`, `SchemaHost`, the finder/calculations/persistence hosts
in `persistence.ts`, `relation/finder-methods.ts`, `relation/calculations.ts`,
`model-schema.ts`, `encryption/encryptable-record.ts`) and forces null-guards on
hot paths that are never null for a persistable (non-view) model. Rails expresses
this as an untyped dynamic `nil`, so the non-null contract holds for every model
you can actually persist/query.

Tracked so the type fidelity can be revisited holistically rather than via an
unsafe cast.

## Acceptance criteria

- [ ] Decide and implement: either widen `primaryKey`/`getPrimaryKeyAttr` (and
      the host interfaces) to `string | string[] | null` with correct null
      handling at the now-flagged call sites, or formalize the non-null contract
      (e.g. a separate nullable accessor for the view case) and remove the
      `as string | string[]` cast in `getPrimaryKeyAttr`.
- [ ] No behavior change for persistable models; views continue to resolve to a
      null primary key (view.test.ts cases stay green).
- [ ] ≤ ceiling; single PR from main.
