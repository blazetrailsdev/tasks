---
title: "schema-compare-invented-baseline-burndown"
status: ready
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

`pnpm schema:compare` (PR #4966, RFC 0025) proved TEST_SCHEMA's mirror of
`vendor/rails/activerecord/test/schema/schema.rb` is faithful where the two
overlap — all 704 Rails columns across the 233 shared tables are ported with
zero type divergence — but it also surfaced **100 purely additive inventions**
recorded in `scripts/schema-compare/invented-baseline.json`:

- 99 tables with no `create_table` anywhere in `vendor/rails/activerecord`
  (verified against schema.rb _and_ the four adapter-specific schema files):
  the `sc_*` / `sc2_*` / `sc3_*` / `sc4_*` families, `refl_*`, `target_as`,
  `targets`, `orphans` / `orphan2s`, `topic2s`, `top_users`, `tenants`,
  `teams`, `profiles`, `publishers`, `patients`, `standalones`, `sub_books`,
  `special_books`, `post_tags`, and others.
- 1 column: `admin_users.region_id`.

The `*2s` / `sc2_` / `sc3_` style names are the rename-to-avoid-collision
pattern that RFC 0059 exists to eliminate — the fix is to converge the tests
onto canonical tables, not to rename.

The comparator gate is a ratchet: the baseline may shrink but never grow
(`--write` refuses to add entries). This story is the burndown.

## Acceptance criteria

- Each invented table is either removed (tests converged onto the canonical
  table it duplicates) or, if genuinely required, added to schema.rb upstream.
- `scripts/schema-compare/invented-baseline.json` shrinks accordingly;
  reseed with `pnpm schema:compare:reseed`.
- No test is renamed to dodge a collision (CLAUDE.md: never rename tests).
- Split across several PRs by family (`sc_*`, `refl_*`, ...) — the 500-LOC
  ceiling applies per PR; register follow-ups rather than fanning out.
