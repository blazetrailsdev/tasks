---
title: "Converge attribute-assignment.ts's hash guards onto attribute_assignment.rb"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-08-20T12:52:31Z"
assignee: "converge-accepts-multiparameter-time-cast-from-multiparameter"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb` is 33 code
lines: `assign_attributes` (`:16`), `_assign_attributes` (`:36`),
`_assign_attribute` (`:67`), `attribute_writer_missing` (`:48`), and the
`ArgumentError` raise for a non-hash argument.

`packages/activemodel/src/attribute-assignment.ts` is 149, of which 13 map onto
those and **54 do not**: `assertHashAttributes` (`:11`, `:175`),
`writeAttribute` (`:65`), `readPermitted` (`:75`), `isMassAssignmentEmpty`
(`:98`), `isParamsLikeWrapper` (`:119`), `isHashLike` (`:189`),
`typeNameForError` (`:195`), `findSetter` (`:233`).

Rails' whole non-hash guard is:

```ruby
unless new_attributes.respond_to?(:each_pair)
  raise ArgumentError, "When assigning attributes, you must pass a hash as an argument, #{new_attributes.class} passed."
end
return if new_attributes.empty?
```

— three lines, where trails has `assertHashAttributes` + `isHashLike` +
`typeNameForError` + `isMassAssignmentEmpty` (~22 lines). `findSetter` walks
the prototype chain for a `name=` accessor; Rails uses `respond_to?(setter)`.
`isParamsLikeWrapper` and `readPermitted` are the
`ForbiddenAttributesProtection` path, whose Rails home is
`forbidden_attributes_protection.rb` (already ported at
`packages/activemodel/src/forbidden-attributes-protection.ts`).

**Coordinate with open PR #6738**, which rewrites `_assignAttribute` in this
file to send the setter and fall back to `attribute_writer_missing`, matching
`attribute_assignment.rb:67-75`, and makes `attributeWriterMissing` required on
`AttributeAssignment`. Branch from `main` after it merges and read its diff
first — several of the helpers above may already be gone.

## Acceptance criteria

- The non-hash guard is Rails' three lines, with the `ArgumentError` message
  string verbatim including the class name interpolation.
- `findSetter` is replaced by the `respond_to?(setter)` check trails already
  spells elsewhere.
- `isParamsLikeWrapper` / `readPermitted` move to
  `forbidden-attributes-protection.ts` or are deleted as duplicates of what is
  there.
- `pnpm parity:api:extra --package activemodel` shows
  `attribute-assignment.ts` at 0 novel, and `index.ts` loses the
  `assignAttributes`, `attributeWriterMissing` and `assertHashAttributes` rows.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.

## Verification

```bash
pnpm vitest run packages/activemodel/src/attribute-assignment.test.ts packages/activemodel/src/forbidden-attributes-protection.test.ts
```
