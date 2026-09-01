---
title: "Delete the invented assignNestedAttributes dispatcher; callers go through the generated writer"
status: done
updated: 2026-09-01
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 7358
claim: "2026-09-01T20:02:55Z"
assignee: "delete-invented-assign-nested-attributes-dispatcher"
blocked-by: null
closed-reason: null
---

## Context

`assignNestedAttributes` (`packages/activerecord/src/nested-attributes.ts:54`)
has no Rails counterpart. Rails' only entry point into nested-attribute
assignment is the writer `generate_association_writer` emits
(`activerecord/lib/active_record/nested_attributes.rb:385-393`):

```ruby
def #{association_name}_attributes=(attributes)
  assign_nested_attributes_for_#{type}_association(:#{association_name}, attributes)
end
```

The `type` is baked in at definition time from
`reflection.collection?` (`nested_attributes.rb:366`). trails instead exports a
runtime dispatcher that re-reads `_reflectOnAssociation(...).isCollection()` on
every call and picks the assigner itself. PR #7355 converged its body (it used
to stage attributes in `_pendingNestedAttributes`) but left the function
standing, because ~12 test call sites in `autosave-association.test.ts`,
`autosave-association.trails.test.ts` and `nested-attributes.trails.test.ts`
use it, and it is re-exported from `index.ts:235`.

## Converged shape

Delete `assignNestedAttributes` and its `index.ts` export. Its callers go
through the generated writer, which `generateAssociationWriter`
(`nested-attributes.ts`) already installs as both `set<Name>Attributes` and
`<name>Attributes=` — the same surface Rails users get. That also drops one
name from activerecord's extra-surface `total`.

## Acceptance criteria

- [ ] `git grep assignNestedAttributes -- packages/` matches nothing outside
      the two `assignNestedAttributesFor*` functions.
- [ ] No test reaches the assigners other than through the generated writer.
- [ ] `pnpm parity:api:extra:gate` mark for activerecord tightens by one.
- [ ] `nested-attributes*.test.ts` and `autosave-association*.test.ts` green.
