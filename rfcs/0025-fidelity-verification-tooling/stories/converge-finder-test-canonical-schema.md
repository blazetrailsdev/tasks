---
title: "converge-finder-test-canonical-schema"
status: in-progress
updated: 2026-07-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4401
claim: "2026-07-02T03:08:21Z"
assignee: "converge-finder-test-canonical-schema"
blocked-by: null
---

## Context

The `blazetrails/require-canonical-schema` ESLint rule was fixed in the
`require-canonical-schema-unwrap-as-const` story (RFC 0025) to unwrap
`as const` / `satisfies` before deciding canonicality. That fix exposed
`packages/activerecord/src/finder.test.ts`, which declares topics (no last_read), posts, and siblings wrapped in `as const` and passes it to
`defineSchema(...)` — a bespoke schema that had been silently evading the
ratchet through the `TSAsExpression`/`TSSatisfiesExpression` AST blind spot.

To keep that PR scoped to the rule fix, `packages/activerecord/src/finder.test.ts` was re-grandfathered in
`eslint/require-canonical-schema-exclude.json`. This story removes that
exclude entry by converging the file onto the canonical `TEST_SCHEMA`
(`test-helpers/test-schema.js`) + fixtures / official models, matching Rails
table/column/model names exactly. If the canonical schema lacks something the
test needs, add it to the canonical schema — do not keep a bespoke shape.

These bespoke `topics`/`posts` shapes are the shared-table contaminators
behind documented shared-DB flakes (e.g. `date_attrmethods_pg_flake`), so
converging them removes a real source of parallel-fork instability.

## Acceptance criteria

- [ ] Replace the bespoke `as const` schema in `packages/activerecord/src/finder.test.ts` with the canonical
      `TEST_SCHEMA` (or per-table `TEST_SCHEMA.<table>` references / fixtures /
      official models). Table, column, and model names match Rails verbatim.
- [ ] Remove `packages/activerecord/src/finder.test.ts` from
      `eslint/require-canonical-schema-exclude.json`; the rule lints it clean
      with no `eslint-disable`.
- [ ] Test names remain verbatim (no renames). Behavior matches the Rails
      source; fix the implementation, not the test name, if anything diverges.
- [ ] No new shared-DB shape drift introduced.
