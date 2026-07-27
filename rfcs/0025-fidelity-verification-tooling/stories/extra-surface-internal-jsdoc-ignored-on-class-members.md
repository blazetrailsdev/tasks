---
title: "extra-surface: @internal JSDoc is ignored on class members too"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Surfaced while reconciling globalid's extra surface (#5333).

`scripts/api-compare/extra-surface.ts:21` documents `@internal` JSDoc as one of
the signals that sets `internal: true` on a member, and the in-progress story
`extra-surface-honor-internal-jsdoc-on-file-functions` (#5335) repeats that
premise — "It does — but only for class/module members." **That premise is
wrong: class members do not honor `@internal` JSDoc either.**

`scripts/api-compare/extract-ts-api.ts:2052` (`memberVisibility`) derives
visibility purely from TS modifiers:

```ts
function memberVisibility(member: ts.ClassElement): "public" | "private" | "protected" {
  if (hasModifier(member, ts.SyntaxKind.PrivateKeyword)) return "private";
  if (hasModifier(member, ts.SyntaxKind.ProtectedKeyword)) return "protected";
  if (member.name && ts.isPrivateIdentifier(member.name)) return "private";
  return "public";
}
```

`internal` is then `visibility !== "public"` (extract-ts-api.ts:1401). No
leading JSDoc is ever read for class members.

Reproduction before #5333 landed (`pnpm api:compare`, then inspect
`scripts/api-compare/output/ts-api.json`): both
`packages/globalid/src/signed-global-id.ts`'s `[Symbol.toPrimitive]` and
`packages/globalid/src/uri/gid.ts`'s `GID` constructor carried a
`/** @internal */` JSDoc, yet both were recorded `visibility: "public"` with no
`internal` flag, and both were reported by `pnpm api:extra --package globalid`.
Only rewriting them to TS `private`/`protected` removed them.

Impact: the same false-positive class #5335 is fixing for file functions also
inflates the class-member side of `api:extra`, and authors who reach for the
documented `@internal` escape hatch on a method get no effect.

## Acceptance criteria

- Decide the intended contract: either make `memberVisibility` (or its caller)
  honor a leading `@internal` JSDoc tag for class members, or correct
  `extra-surface.ts:21` and the `#5335` story text to state that only TS
  visibility modifiers count.
- If honoring the tag: computed member names (`[Symbol.toPrimitive]`) and
  constructors must be covered — those were the two concrete misses.
- `scripts/api-compare/extract-ts-api.test.ts` gains a case pinning the chosen
  behavior for a class member carrying `@internal`.
- Re-run `pnpm api:extra` and reconcile any allowlist entries in
  `scripts/api-compare/extra-surface-allow.json` that the change makes stale
  (the `globalid uri/gid.ts constructor` entry is a candidate).

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
