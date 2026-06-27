---
title: "Materialize declares: resolve cross-file subtype narrowing (classExtends in-file-only limitation)"
status: claimed
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 85
pr: null
claim: "2026-06-27T18:06:35Z"
assignee: "materialize-declares-cross-file-subtype-suppression"
blocked-by: null
---

## Context

`materialize-declares-generator-fixes` (PR #4170) added subclass-association
conflict suppression to the declare materializer. When a subclass overrides a
`belongsTo`/`hasOne` with a target NOT assignable to the ancestor's, the
property declare is suppressed to avoid TS2416. The assignability check,
`classExtends` in
`packages/activerecord/src/type-virtualization/synthesize.ts`, walks only the
**in-file** `superNameOf` map built by `buildInheritance` in `virtualize.ts`
(`extends X` resolved to in-file classes only).

Consequence: if a subclass narrows an association to a target whose superclass
chain is defined in a **different** model file (e.g. `SpecialComment` in
`comment.ts` declares `belongsTo("post", { className: "SpecialPost" })` where
`SpecialPost extends Post` lives in `post.ts`), `classExtends("SpecialPost",
"Post")` returns false → the narrower `declare post: SpecialPost | null` is
**conservatively suppressed** (the subclass inherits the base `post: Post`).
This is typecheck-green (never wrong-compiles) but silently loses a correct,
more-precise declare. Documented as a known limitation in the `classExtends`
JSDoc (synthesize.ts).

No canonical model triggers this today, so it is a precision follow-up, not a
correctness regression.

## Acceptance criteria

- [ ] `classExtends` (or its caller) consults a cross-file inheritance map so a
      subclass narrowing to a target whose `extends` chain lives in another
      model file is recognized as a valid subtype and the precise declare is
      KEPT (not suppressed).
- [ ] The generator threads a global `superNameOf` (built from the model
      registry, mirroring `buildModelAssociationLookup`) into the virtualizer,
      or an equivalent cross-file resolution.
- [ ] Regression test: a subclass in file A narrows an association to a subtype
      defined in file B; the materialized declare keeps the subtype.
- [ ] Existing in-file behavior and all `materialize-declares-generator-fixes`
      tests stay green; the three pilot+gap models still materialize
      typecheck-green.

## Notes

Mirrors the cross-file pattern already used for through-target resolution
(`buildModelAssociationLookup` in `materialize-model-declares.ts`). Scope is the
inheritance map + the `classExtends` signature change; ~50 LOC.
