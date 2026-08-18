---
title: "scope() no-reflection fallback raises for polymorphic composite keys Rails accepts"
status: draft
updated: 2026-08-03
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
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

`scope()` (`packages/activerecord/src/associations/has-many-association.ts`,
introduced by PR #5939) gates its polymorphic composite-key guard on
`!reflection`:

```ts
if (options.as && !reflection) {
  if (Array.isArray(foreignKey)) { routeThroughCheckValidity(...); throw new CompositePrimaryKeyMismatchError(...); }
  if (Array.isArray(primaryKey) && !primaryKey.includes("id")) { ... }
}
```

The reflection-backed arm is now faithful: Rails'
`AssociationReflection#check_validity!`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:618`) opens with
`!polymorphic? && (...)`, so a polymorphic reflection is never shape-checked at
any FK/PK lengths, and `checkValidityBang`
(`packages/activerecord/src/reflection.ts:1162`) ports that.

The **no-reflection inline fallback still raises where Rails raises nothing.**
That divergence is deliberate and documented inline (with no reflection there is
no canonical check to consult, and an unzippable FK/PK pairing would otherwise
read `readAttribute(undefined)` into broken SQL), but it is a trails-only
limitation, not Rails behavior.

The real fix is upstream of the guard: the inline fallback exists only because
some associations never go through `Reflection.create`. Either give those paths a
reflection, or teach the fallback to build the polymorphic composite zip
(`{ [typeCol]: polymorphicName(ctor), ...fk[i]: pk[i] }` — the shape the deleted
`computeHasManyWhere` used to build) instead of throwing.

Related: `owner-fk-inline-fallback-rungs-have-no-rails-counterpart` (draft)
covers the neighbouring inline-fallback FK derivation rungs.

## Acceptance criteria

- A polymorphic `:as` association reaching `scope()`'s no-reflection fallback no
  longer raises `CompositePrimaryKeyMismatchError` for a shape Rails accepts.
- The `options.as && !reflection` guard is either removed or reduced to the cases
  Rails genuinely rejects; the inline "trails limitation" comment goes with it.
- A test covers the fallback path for a composite-PK polymorphic owner (the
  reflection-backed equivalent is `BelongsToAssociationsTest > where on
polymorphic association with cpk`).
- No test renames.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
