---
title: "converge-assign-attribute-writer-ladder-onto-public-send"
status: done
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6782
claim: "2026-08-20T18:15:06Z"
assignee: "converge-assign-attribute-writer-ladder-onto-public-send"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-assignment.ts`'s `_assignAttribute`
resolves the writer through a private `findSetter()` that walks the
instance → prototype chain for a `set name(v)` accessor descriptor, then
falls back to a `name=` function property, then to
`matchedAttributeMethod` / `attributeMissing`, then to
`attributeWriterMissing`.

Rails is (attribute_assignment.rb:67-75):

```ruby
def _assign_attribute(k, v)
  setter = :"#{k}="
  public_send(setter, v)
rescue NoMethodError
  if respond_to?(setter)
    raise
  else
    attribute_writer_missing(k.to_s, v)
  end
end
```

`converge-attribute-assignment-hash-guards` converged the file's hash
guards (`assertHashAttributes` / `isHashLike` / `typeNameForError` are
gone, the `ArgumentError` is Rails' three lines, and
`isParamsLikeWrapper` / `readPermitted` / `sanitizeForMassAssignment`
moved to their Rails home in `forbidden-attributes-protection.ts`), but
left the writer ladder alone: it was rewritten by PR #6738 with a long
justification, its remaining arm is already tracked by
`assign-attribute-respond-to-setter-reraise-arm`, and `findSetter` is a
file-private function that scores no `parity:api:extra` row — so the
change is pure risk inside a bundle already at its LOC ceiling.

The ladder is still not Rails' control flow: Rails sends once and
branches in a `rescue`, trails resolves first and branches on what it
found, and the branch ORDER differs (trails tries the accessor before
the generated `name=`, and `attribute_missing` before
`attribute_writer_missing`).

## Acceptance criteria

- `_assignAttribute`'s body is Rails' send-then-rescue shape with the
  same branch order, or a `@noRailsEquivalent`-free explanation at the
  call site of the single genuine JS shortcoming (a `set name(v)`
  accessor is not reachable by the key `"name="`).
- `findSetter` is gone.
- `packages/activemodel/src/attribute-assignment.test.ts` and
  `packages/activerecord/src/attribute-assignment.test.ts` stay green.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.
