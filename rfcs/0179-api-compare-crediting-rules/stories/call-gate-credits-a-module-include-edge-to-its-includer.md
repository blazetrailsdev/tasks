---
title: "parity: the include-graph walk resolves an include() edge onto a ruby-compat Module"
status: closed
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone: trails#8417 (3d07d2a9f3) moved ThroughAssociation#build_record to a top-level function in associations/through-association.ts, so the extractor credits it in its own file, and deleted the stale '@missingRailsCall map' receipt on HasManyThroughAssociation#buildRecord — the only receipt this story clears. On origin/main @ cc4a0a4a6f, 'git grep -F call-gate-credits-a-module-include-edge-to-its-includer -- packages' returns 0 hits and has-many-through-association.ts carries no @missingRailsCall. The include-graph Module-resolution rule has no remaining receipt to justify it; refile in 0179 if a new one appears."
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`HasManyThroughAssociation#build_record`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:90-114`)
calls no `map`, and trails' port (`packages/activerecord/src/associations/has-many-through-association.ts`
`buildRecord`) follows it line for line. It still carries `@missingRailsCall map`.

The `map` is `ThroughAssociation#build_record`'s
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/through_association.rb:116-129`), the
module `HasManyThroughAssociation` includes. The extractor attributes a mixed-in module's methods to the
including class's file, so the class's `buildRecord` is charged with the mixin's call set
(`scripts/api-compare/include-graph.ts`'s header describes exactly this). trails ports the module body
at its Rails home — `packages/activerecord/src/associations/through-association.ts` `buildRecord`, which
does call `map` — and mixes it in with `include(HasManyThroughAssociation, ThroughAssociation)`. The
include-graph walk is supposed to credit that edge and does not: the mixin is a `Module` built from an
object literal, not a recorded class/module entity, so the edge names nothing the walk can resolve.

## Acceptance criteria

- [ ] The include-graph walk resolves an `include(Klass, Mod)` edge whose `Mod` is a ruby-compat `Module` declared in the package, so the includer is credited with the module body's calls, with a unit test in `scripts/api-compare/include-graph.test.ts`.
- [ ] The `@missingRailsCall map` receipt on `HasManyThroughAssociation#buildRecord` is deleted and `pnpm parity:api:calls` is green with no new baseline row.
- [ ] No sibling implementation is credited through proximity: the walk still follows recorded edges only.

## Verification

```bash
pnpm vitest run scripts/api-compare/include-graph.test.ts && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls && pnpm parity:api:receipts:gate
```
