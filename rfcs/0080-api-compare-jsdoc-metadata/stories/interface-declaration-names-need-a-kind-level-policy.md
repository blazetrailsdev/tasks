---
title: "Decide whether an interface declaration name is extra surface by kind or only by tag"
status: done
updated: 2026-07-30
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5664
claim: "2026-07-30T19:35:17Z"
assignee: "interface-declaration-names-need-a-kind-level-policy"
blocked-by: null
closed-reason: null
---

## Context

PR 5653 made class / interface / namespace DECLARATION names count as extra
surface (`collectTsFileNames`, `scripts/api-compare/extra-surface.ts`). Totals
moved 3838 -> 4780 extras, and the increase is dominated by TypeScript-only
`interface` declarations: 180 names ending `…Options`, 77 `…Host`, 36 `…Error`,
29 `…Like`.

These are type-only shapes that exist because TS has to write down what Ruby
leaves to duck typing, so a Ruby counterpart is impossible by construction —
the same reasoning `collectTaggedEntries` already applies to a tagged
interface's MEMBERS (PR 5467, `extra-surface-skip-duck-typed-interface-members`).
Today the only exemption is a per-declaration `@noRailsEquivalent` tag, which
would mean writing ~350 near-identical tags.

Decide whether an `interface` declaration name is exempt BY KIND (the way its
members are once the declaration is tagged) or must stay individually tagged.
Note the counter-argument for keeping them scored: a TS `interface` is
sometimes a real port of a Ruby module's shape, and a blanket exemption would
hide that drift.

## Acceptance criteria

- Decide and encode the policy for `interface` declaration names.
- If exempt by kind, `parity:api:extra` totals re-measure and the decision is written
  down where the tag grammar is documented
  (`docs/infrastructure/api-build-stub-generation-plan.md`).
- `pnpm parity:api:extra` exits 0 with no stale tags either way.
