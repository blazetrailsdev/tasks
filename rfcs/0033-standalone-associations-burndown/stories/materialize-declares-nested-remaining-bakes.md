---
title: "materialize-declares-nested-remaining-bakes"
status: done
updated: 2026-06-25
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4119
claim: "2026-06-25T13:39:31Z"
assignee: "materialize-declares-nested-remaining-bakes"
blocked-by: null
---

## Context

Follow-up to `materialize-declares-nested-class-models` (PR #4036). That PR
extended the type-virtualization walker
(`packages/activerecord/src/type-virtualization/walker.ts`) to visit model
classes nested in `describe`/`it`/function bodies and the generator
(`packages/activerecord/scripts/materialize-model-declares.ts`), then baked
declares into the seven smallest typecheck-green files.

The remaining nested-class files still need their declares baked in. The
full set was ~9,000 lines so it cannot land in one ceiling-respecting PR.
Bake these via `pnpm tsx scripts/materialize-model-declares.ts <file>`
(run from `packages/activerecord`), `prettier --write`, then `pnpm eslint`,
shipping in ≤500-LOC PRs (each PR a non-overlapping subset, branched from
main — NO stacked PRs). Approximate generated additions per file:

- `timestamp.test.ts` (+113)
- `transaction-callbacks.test.ts` (+127)
- `test-fixtures.ts` (+156)
- `associations/association-scope.test.ts` (+198)
- `associations/nested-through-associations.test.ts` (+226)
- `associations/has-one-through-associations.test.ts` (+267)
- `relation/where.test.ts` (+450)
- `strict-loading.test.ts` (+469)
- `reflection.test.ts` (+551)
- `counter-cache.test.ts` (+604)
- `autosave-association.test.ts` (+646)
- `associations/belongs-to-associations.test.ts` (+739)
- `calculations.test.ts` (+1037)
- `associations/has-many-associations.test.ts` (+1308)
- `associations/has-many-through-associations.test.ts` (+1724)

Three other files (eager-singularization, nested-attributes,
association-validation) are tracked separately under
`materialize-declares-nested-generator-gaps` — they need generator fixes
first. Any file here that turns out to need a generator fix should be moved
to that story rather than baked with broken declares.

## Acceptance criteria

- [ ] All listed files have materialized `declare` accessors baked into
      source via the existing generator (out-of-MODELS_DIR no-schema-merge
      path — no phantom canonical columns).
- [ ] `pnpm typecheck` green; affected suites green; no behavior change
      (declares are types-only).
- [ ] Single-file bakes exceeding 500 LOC are mechanical/generated; note
      that in the PR body. NO stacked PRs; each PR from main with
      non-overlapping files.
