---
title: "schema:compare invented-baseline burndown (continued: 85 tables remaining)"
status: done
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 20
pr: 5219
claim: "2026-07-24T12:23:23Z"
assignee: "schema-compare-invented-baseline-burndown-continue"
blocked-by: null
closed-reason: null
---

## Context

Successor to `schema-compare-invented-baseline-burndown`, closed by PR #4973.
That PR removed the `refl_*` family plus the orphaned `libraries` table,
taking `scripts/schema-compare/invented-baseline.json` from **90 -> 85**
invented tables (plus the 1 invented column, `admin_users.region_id`, still
untouched).

Remaining families, largest first: `sc_*` / `sc2_*` / `sc3_*` / `sc4_*`
(rename-to-avoid-collision pattern, ~14 tables), `ns_*` (~10), `n_*` (~6),
plus `orphans` / `orphan2s`, `topic2s`, `company2s`, `contract2s`,
`target_as`, `targets`, `teams`, `tenants`, `profiles`, `publishers`,
`patients`, `standalones`, `sub_books`, `special_books`, `post_tags`,
`top_users`, and others. The `*2s` / `sc2_` naming is exactly the collision
pattern RFC 0059 exists to eliminate — converge onto the canonical table, do
not rename.

The comparator is a ratchet: the baseline may shrink but never grow
(`--write` refuses to add entries). Reseed with `pnpm schema:compare:reseed`.

**Method that worked in #4973**, worth reusing: read the Rails test first
(`pnpm rails:find <name>`), switch to the canonical models, add
`import "./test-helpers/canonical-model-index.js"` so association targets
without their own fixture set resolve, then delete the table from BOTH
`test-helpers/canonical-schema.ts` and `test-helpers/test-schema.ts`. Check
for tables the conversion orphans (`libraries` was a free extra removal).
Beware the registry-shadowing trap — see
`reflection-test-bespoke-registermodel-canonical-name-collisions`.

## Acceptance criteria

- One family per PR (500-LOC ceiling applies per PR); register a further
  successor rather than fanning out sibling PRs.
- Each invented table is removed (tests converged onto the canonical table it
  duplicates) or, if genuinely required, added to schema.rb upstream.
- `invented-baseline.json` shrinks; reseeded via `pnpm schema:compare:reseed`.
- No test renamed to dodge a collision (CLAUDE.md).
- `pnpm schema:compare` reports `new-inventions=0`.
