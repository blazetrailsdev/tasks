---
title: "Resolve the synthesized __mixin constructor that no declaration-derived field can reach"
status: done
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5468
claim: "2026-07-28T00:10:17Z"
assignee: "mixin-constructor-entry-cannot-carry-declaration-metadata"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while pinning the emit-site inventory in PR #5463.

`extract-ts-api.ts:674-683` synthesizes a `constructor` entry for every
`__mixin` module from the factory's construct signature. The entry carries no
`declaredIn`, so `collectTsFileNames` (`extra-surface.ts:494-504`) counts it as
the file's own surface — but there is no member declaration behind it to read
JSDoc off, so NO declaration-derived field can ever reach it: not `internal`,
not `noRailsEquivalent`, and not the next one (`@missingRailsCall`).

The inventory test pins this as a documented exception
(`EMIT_SITE_INVENTORY`, `Attributes__mixin#constructor` with
`hasReason: false`) rather than resolving it. If a mixin's inner class declares
its own tagged `constructor`, that member is reachable via
`instanceType.getProperties()` and its tag is currently discarded in favour of
the synthesized entry.

Two candidate resolutions, to be decided during triage:

1. Read the inner class's `constructor` declaration when one exists and copy
   its metadata onto the synthesized entry.
2. Establish that a counted-but-undeclarable entry is acceptable and state that
   in the emit-site rule block, so future fields need not chase it.

## Acceptance criteria

- Decide between the two resolutions above and implement it.
- If (1): a tagged `constructor` inside a mixin's inner class carries its tag
  onto the `__mixin` entry, and `EMIT_SITE_INVENTORY` loses that exception.
- If (2): the emit-site comment block in `extract-ts-api.ts` names synthesized
  entries as a third population alongside `synthesizedMixin`-with-`declaredIn`
  and `extractFileLocalHelpers` output.
- No change to the counted-vs-not rule itself.
