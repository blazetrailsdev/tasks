---
title: "A literal constant cannot carry a @noRailsEquivalent receipt, forcing private as the only remedy"
status: draft
updated: 2026-09-06
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extractFileConstants` (`scripts/api-compare/extract-ts-api.ts:3970-3990`)
collects every exported `const NAME = <literal>` and every PUBLIC
`static readonly NAME = <literal>` into a per-file constants map holding only
`{kind, value}` — no JSDoc, no `noRailsEquivalent` field. `collectTaggedEntries`
(`scripts/api-compare/extra-surface.ts:677-760`) builds the receipt index from
methods and class declarations only, so a constant reaching the scored surface
through `walkTsFileSurface`'s `fileConstants` arm (`extra-surface.ts:1122-1125`)
has no way to carry a `@noRailsEquivalent` receipt.

Hit in PR #7580: `Entry_::S_IF_DOOR` (`vendor/ruby/lib/fileutils.rb:2153`) is a
faithful port of a Ruby constant in `packages/ruby-compat/src/file-utils.ts`, a
file no Rails file maps onto. A `@noRailsEquivalent PERMANENT` receipt on it did
not register — `ruby-compat novel: 0 → 1` stayed red — and the only remedy left
was `private static readonly`, which drops it from the surface via the
`memberVisibility` check. That works, but it makes TS visibility the receipt
mechanism: the constant is public in Ruby, and the next such constant will hit
the same dead end and reach for the same non-answer.

The pinned-package remedy the gate prints — "Add the receipt, or delete the
name" — is not available for this kind of declaration, which is what makes this
a tooling gap rather than a porting decision.

## Converged shape

Carry a `noRailsEquivalent` (and `internal`) field on the `fileConstants`
entries the way `MethodInfo` does, and push them in `collectTaggedEntries`, so a
constant's receipt registers like any other declaration's. The reverse rule
(`unbacked-internal-needs-receipt`) should see them too.

Then restore `Entry_::S_IF_DOOR` to `static readonly` with its receipt.

## Acceptance criteria

- A public `static readonly` literal constant carrying
  `@noRailsEquivalent PERMANENT` is scored `Allowed`, not `novel`.
- An extractor test pins that the tag survives into `ts-api.json` for both the
  `export const` and the `static readonly` arms.
- `Entry_::S_IF_DOOR` is public again and `parity:api:extra:gate` stays green.
