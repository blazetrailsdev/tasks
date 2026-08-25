---
title: "Drop the scope-source STI-ancestor escape in subclassFromAttributesForNew; raise SubclassNotFound as find_sti_class does"
status: done
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6720
claim: "2026-08-18T20:31:56Z"
assignee: "wave-4c-ar-core-residue-attributes"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the rest of the `new()` STI dispatch gate in
PR #6713 (`converge-new-sti-gate-onto-has-attribute-alone`). That PR removed the
`descendants` stand-in and made the no-match path call `findStiClass`
unconditionally, matching Rails. One deviation inside the same closure was left
untouched and is now the only one there.

`subclassFromAttributesForNew`'s `resolve` helper
(`packages/activerecord/src/inheritance.ts:1150-1167`) carries:

```ts
if (fromScope && namesSelfOrStiAncestor(modelClass, typeName)) return null;
```

i.e. when the _scope_ source (`current_scope&.scope_for_create`) sets the
inheritance column to the receiver itself or to an STI ancestor of it, trails
builds the receiver as-is instead of raising.

Rails has no such branch. `ClassMethods#new`
(`vendor/rails/activerecord/lib/active_record/inheritance.rb:56-78`) feeds the
scope attributes to the same `subclass_from_attributes`
(`:331-340`) as the explicit attributes, which calls `find_sti_class`
unconditionally once `subclass_name.present?`. `find_sti_class` raises
`SubclassNotFound` unless the resolved constant is `self` or in `descendants`
(`:242-265`, the `unless subclass == self || descendants.include?(subclass)`
check). An STI _ancestor_ is neither, so Rails raises where trails returns null.

The call-site comment claims this is the `_applyScopeAttributes` rule — "the
receiver already is that type, and its own STI column wins" — which is a
preference, not a language shortcoming.

## Converged shape

Delete the `fromScope` parameter and the `namesSelfOrStiAncestor` early return,
so the scope source resolves through exactly the same path as the explicit
attributes and an ancestor type raises `SubclassNotFound` as Rails does.
`namesSelfOrStiAncestor` may then be dead — check and remove it if so
(`parity:api:extra` will flag it as extra surface if it is not a Rails name).

Verify against the Rails-mirrored suites that exercise scope-created STI
records; if one of them depends on the build-as-is behaviour, read the Rails
test it mirrors before changing anything — a green trails test asserting the
deviation is itself the bug.

## Acceptance criteria

- [ ] `resolve` takes no `fromScope` argument and has no scope-only early
      return; all three attribute sources resolve identically, as in
      `inheritance.rb:56-78`.
- [ ] A scope setting the inheritance column to an STI ancestor of the receiver
      raises `SubclassNotFound`, matching `find_sti_class`
      (`inheritance.rb:242-265`).
- [ ] `namesSelfOrStiAncestor` is removed if it has no remaining caller.
- [ ] The call-site deviation comment is deleted, not reworded.
- [ ] `parity:api` / `parity:test` deltas non-negative; `parity:api:calls` and
      `:args` clean.
