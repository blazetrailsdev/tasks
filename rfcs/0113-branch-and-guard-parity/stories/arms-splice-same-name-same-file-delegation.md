---
title: "arms-splice-same-name-same-file-delegation"
status: draft
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`report-arms.ts#spliceHelperSkeletons` (RFC 0113,
`arms-report-unions-same-file-helper-skeletons`) replaces a `ref:<helper>`
reach with that helper's own skeleton when the name resolves to a SAME-FILE
method, using the per-(file, name) scoping `compare.ts#sameFileHelperSkeletons`
keys on — the same scoping `effectiveTsCalls` unions call sets over.

That scoping cannot resolve a delegation from a method to a top-level function
of the SAME name in the same file. `packages/activerecord/src/associations/has-many-through-association.ts:81-82`
is exactly that shape:

```ts
protected markOccurrence(distribution: Occurrences, record: Base): boolean {
  return markOccurrence(distribution, record);   // :494, a top-level function
}
```

`tsSkeletonByFileName` keys by name alone, so both declarations land under
`markOccurrence` and the resolver's `sets?.length === 1` guard — the same
ambiguity refusal the call-argument comparison makes — declines the pair.
`sameFileHelperSkeletons` additionally skips the body's own name so a
self-recursive call cannot splice a body into itself, and a same-named
top-level function is indistinguishable from that at this layer.

This is row 32 of `docs/infrastructure/arm-mismatch-noise-floor.md`, and it is
the only remaining same-file helper-delegation row the sample turned up: the
report still charges the caller for the `if` that lives in the function it
delegates to.

## Acceptance criteria

- [ ] The skeleton record distinguishes a class member from a top-level
      function of the same name in the same TS file, so a method delegating to
      a same-named top-level function resolves as a helper reach.
- [ ] Self-recursion still does not splice.
- [ ] Unit test on `compare.ts#sameFileHelperSkeletons` (or its successor)
      pinning the method-to-same-named-function shape.
- [ ] Row 32 (`activerecord …/has-many-through-association.ts#markOccurrence`)
      no longer reports; before/after `pnpm parity:api:arms:report` row count in
      the PR body.
- [ ] Nothing new gates.
