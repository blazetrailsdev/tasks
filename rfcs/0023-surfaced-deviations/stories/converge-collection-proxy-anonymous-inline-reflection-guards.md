---
title: "Retire the anonymous-inline reflection fallback and its two klass==null guards"
status: draft
updated: 2026-08-12
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6428 (RFC 0084,
`converge-collection-proxy-rich-reflection-re-resolve`).

`CollectionProxy#reflection` now resolves the registered reflection off the
owner's class, mirroring Rails' `Association#reflection`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:16`,
handed the rich reflection at `associations.rb:290-296`). It falls back to the
thin macro definition (`_assocDef`) when the owner's class has no registered
reflection for the name — an anonymous inline association.

That fallback forces two guards Rails has no counterpart for, both in
`packages/activerecord/src/associations/collection-proxy.ts`:

- `_djarForCount`: `if (reflection.klass == null) return null;`
- `_foreignKeyPresent`: `if (reflection.klass == null) return false;`

They preserve the pre-#6428 `if (!reflection) return ...` short-circuit exactly
(macro definitions never carry `klass`; only the reflection-builder call sites
at `associations.ts:1126,1251` do), but Rails' `CollectionAssociation` bodies
have no such branch — `foreign_key_present?`
(`collection_association.rb`, `foreign_association.rb:5`) reads the reflection
unconditionally, because in Rails there is always one.

The root cause is that trails permits an association with no registered
reflection at all.

## Converged shape

An inline/anonymous association registers a reflection like every other, so
`CollectionProxy#reflection` never needs the `_assocDef` fallback and both
`klass == null` guards are deleted along with it. Same root cause as
[[converge-association-reflection-type-drop-association-definition]] and
[[converge-association-klass-to-reflection-klass-delegate]].

## Acceptance criteria

- [ ] Both `reflection.klass == null` guards in `collection-proxy.ts` deleted.
- [ ] `CollectionProxy#reflection` returns the registered reflection with no
      `?? this._assocDef` arm, or that arm is shown unreachable.
- [ ] AR association suites green on all three adapter lanes.
