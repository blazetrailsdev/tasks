---
title: "parity:api:extra red on main: NestedAttributesDisplacementError tag lacks a permanence claim"
status: closed
updated: 2026-08-07
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone on origin/main (311bff350): NestedAttributesDisplacementError no longer exists in packages/activerecord/src/associations/errors.ts — the whole nested-attributes property setter it guarded was retired by PR #6167 (ec3f134ef, 'retire the nested-attributes property setter'). errors.ts carries no @noRailsEquivalent tag at all now, so the parity:api:extra permanence-claim red this story was filed for cannot recur."
---

## Context

`pnpm parity:api:extra` exits 1 on `origin/main` (verified at 022262385):

```text
extra-surface: 1 @noRailsEquivalent tag(s) state no permanence claim. Open each
reason with PERMANENT (a language- or runtime-level fact no port can remove) or
CONVERGEABLE (unfinished porting, a fixable collision, a comparator gap — name
the story):
  - activerecord  associations/errors.ts  NestedAttributesDisplacementError
```

`packages/activerecord/src/associations/errors.ts:392` declares
`NestedAttributesDisplacementError`, and its `@noRailsEquivalent` reason (line
~386) opens with "Rails has no such error because `ship_attributes=` does the
displacement inline..." — accurate, but without the required `PERMANENT` /
`CONVERGEABLE` first token the gate rejects it.

Introduced by #5997. Noticed while running pre-PR gates on #5995, which touches
no activerecord file — the gate is red for every PR until this is fixed, so per
CLAUDE.md this is P1.

## Converged shape

The stated reason is a genuine language-level fact (a JS property setter's
value expression cannot be awaited by any caller syntax), so the correct token
is `PERMANENT`:

```ts
 * @noRailsEquivalent PERMANENT — Rails has no such error because
 * `ship_attributes=` does the displacement inline; a JS property setter's
 * value expression cannot be awaited by any caller syntax, ...
```

Confirm that reading against #5997 before editing — if the displacement is
actually reachable once awaitable association writers land
(RFC 0087-awaitable-association-writers-only), the token is `CONVERGEABLE` and
must name that story instead.

## Acceptance criteria

- `pnpm parity:api:extra` exits 0 on main.
- The chosen token reflects the real status, cross-checked against RFC 0087.
