---
title: "CollectionProxy#delete should delegate to association layer (incl. raise_on_type_mismatch), not reimplement dependent dispatch inline"
status: draft
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails `CollectionProxy#delete` is a one-line delegation:
`collection_proxy.rb:623` — `def delete(*records); @association.delete(*records); end`.
The dependent-strategy dispatch, id-coercion (`find`), flatten, and
`raise_on_type_mismatch!` all live once in `CollectionAssociation#delete` →
`delete_or_destroy` (`collection_association.rb:278,534`).

trails instead reimplements that logic *inline* in the proxy
(`packages/activerecord/src/associations/collection-proxy.ts` `delete`, the
`_deleteStrategy()` path added by PR #3738), duplicating the dependent dispatch,
the composite-PK tuple scoping, the counter-cache decrement, and the
find-then-deep-flatten arg handling (PR #3750) that already exist in the
association layer. The through branch (`collection-proxy.ts:2221`) already
delegates raw to `this._record.association(name).delete(...)`; the non-through
branch should too.

Two observable consequences of the inline reimplementation:

1. Logic drift: the proxy and the association layer can diverge (they already
   carry parallel copies of the dependent dispatch + tuple scoping).
2. Missing `raise_on_type_mismatch!`: Rails' `delete_or_destroy` type-checks each
   record, so `proxy.delete([1, 2])` (id-in-array) raises a clean
   `AssociationTypeMismatch`. The trails proxy skips the check, so the same call
   throws a raw `TypeError` on `1.isNewRecord()` instead.

## Acceptance criteria

- [ ] Non-through `CollectionProxy#delete` delegates to the dependent-aware
      association-layer `delete` (`this._record.association(name).delete(...)`)
      exactly as the through branch does and as Rails
      `@association.delete(*records)` does, then syncs the proxy target via
      `_removeFromTarget(removed)`.
- [ ] The inline `_deleteStrategy()` / tuple-scope / counter-decrement /
      find-flatten duplication in the proxy is removed (or reduced to whatever
      the proxy uniquely needs beyond the association layer).
- [ ] `proxy.delete([1, 2])` raises `AssociationTypeMismatch`, matching Rails
      `raise_on_type_mismatch!`, not a raw `TypeError`.
- [ ] All existing `deleting*` and `collection-proxy` tests stay green
      (counter-cache, before/after_remove callbacks, transaction wrapping,
      nullify on non-dependent `clientsOfFirm`).

Hard rules: NO node:* / process.* ; async fs only; no new runtime deps; 500 LOC
ceiling; single PR from main; camelCase; test names match Rails verbatim.
