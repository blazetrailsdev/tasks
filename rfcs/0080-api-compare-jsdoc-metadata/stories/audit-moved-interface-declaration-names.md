---
title: "Resolve the interface declaration names Rails also uses (the moved population the kind exemption deliberately keeps scored)"
status: done
updated: 2026-07-31
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5675
claim: "2026-07-30T20:45:21Z"
assignee: "audit-moved-interface-declaration-names"
blocked-by: null
closed-reason: null
---

## Context

PR 5664 (story `interface-declaration-names-need-a-kind-level-policy`) exempted
NOVEL `interface` declaration names from extra surface by kind, deliberately
leaving the `moved` ones scored: an interface name that appears somewhere in the
Rails source may be a real port of a Ruby module's shape sitting in the wrong
file, which is exactly the drift a blanket exemption would have hidden.

That population is 22 names today (604 interface declaration names scored
before the exemption, 582 exempted). No one has looked at them. Examples seen
while measuring: `Quoting`, `TypeMap`, `Column`, `PrettyPrinter`,
`ValidationsClassMethods`, `CalculationMethods` — each a name Rails does use,
declared in a trails file whose Rails counterpart does not declare it.

Get the current list with:

    pnpm parity:api:extra --json | # extras whose name is an interface-only declaration

or by re-reading `collectInterfaceOnlyNames` in
`scripts/api-compare/extra-surface.ts` and intersecting with the reported
extras of kind `moved`.

Each name resolves one of three ways:

1. **Misplaced port** — move the declaration to its Rails-layout file
   (`rubyFileToTs`), which is the outcome the report exists to produce.
2. **Coincidental name collision** — the TS interface has nothing to do with
   the Ruby constant of the same name. Tag it `@noRailsEquivalent PERMANENT …`
   naming the collision.
3. **Convergeable** — the shape is a stand-in for surface not yet ported. Tag
   `CONVERGEABLE` and register the porting story the reason names.

## Acceptance criteria

- Every `moved` interface declaration name is resolved into one of the three
  buckets above, with the fix or the tag landed.
- `pnpm parity:api:extra` exits 0 with no stale tags.
- If the list is larger than one 500-LOC PR, land the first slice and register
  the rest as follow-up stories rather than fanning out PRs.
