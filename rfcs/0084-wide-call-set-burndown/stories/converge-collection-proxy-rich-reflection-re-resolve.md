---
title: "converge-collection-proxy-rich-reflection-re-resolve"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6428
claim: "2026-08-12T17:36:52Z"
assignee: "converge-collection-proxy-rich-reflection-re-resolve"
blocked-by: null
closed-reason: null
---

# Drop CollectionProxy's \_reflectOnAssociation re-resolves for a held rich reflection

## Context

Split out of `converge-has-many-delete-records-rich-reflection` (RFC 0084),
whose `has-many-association.ts` half landed in PR TBD: `deleteRecords` and
`countRecords` now read `this.reflection` directly, with no
`owner.constructor._reflectOnAssociation(...) ?? this.reflection` re-resolve.

The same shape survives ~18 times in
`packages/activerecord/src/associations/collection-proxy.ts` (e.g. `:1291`,
`:1600`, `:1820`, `:2367` — the counter-cache one the parent story named,
`:2487`, `:3393`). It cannot be deleted the same way: the proxy holds only the
thin `_assocDef`, and its `reflection` getter returns that definition
(`collection-proxy.ts:341-343`), so every rich-reflection predicate it needs is
re-resolved off the owner's class at the call site. Rails' `CollectionProxy`
inherits `Association#reflection` (`association.rb:16`), which IS the rich
`AssociationReflection`.

## Acceptance criteria

- [ ] `CollectionProxy` reaches the rich reflection through one Rails-named
      reader (`reflection`), as `Association#reflection` does.
- [ ] The `_reflectOnAssociation` re-resolves in `collection-proxy.ts` are
      deleted, or each surviving one is cited with the reason it cannot go.
- [ ] AR association suites pass on all three adapter lanes; no new
      `call-mismatches-exclude` row.
