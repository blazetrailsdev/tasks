---
title: "Materialize declares: roll generator over the 28 models skipped by PR #3545"
status: done
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: ["materialize-declares-generator-fixes"]
deps-rfc: []
est-loc: 400
priority: 1
pr: 4193
claim: "2026-06-26T13:41:40Z"
assignee: "materialize-declares-rollout-remaining"
blocked-by: null
---

## Context

Follow-up to `materialize-declares-rollout-waves` (merged PR #3545), which
materialized typed `declare` members into **129** of the canonical
`test-helpers/models/` and deliberately **skipped 28** models that hit
virtualizer/walker gaps (would write broken declares).

`materialize-declares-generator-fixes` (dep) fixes those gaps but its DoD only
commits to `post.ts` / `author.ts` / `comment.ts`. The remaining ~25 skipped
models still need to be materialized into source once the generator emits
correct declares for them.

The full per-model gap inventory (Gaps A–E) lives in
`materialize-declares-generator-fixes`. The skipped set:

- Gap A (`::`-namespaced className): `company.ts`, `company-in-module.ts`
- Gap B (unresolved assoc target): `author`, `member`, `post`, `person`,
  `project`, `friendship`, `club`, `category`, `organization`, `member-detail`,
  `eye`, `zine`, `vertex`, `user`, `tag`, `tagging`, `reference`, `job`,
  `hotel`, `categorization`, `cpk`, `pirate`
- Gap C (subclass loader-override widening): `chef`, `comment`, `cpk`, `pirate`,
  `post`
- Gap D (composed_of aggregation column): `customer`
- Gap E (intentionally-invalid fixture, may be permanent skip):
  `user-with-invalid-relation`

## Acceptance criteria

- [ ] With the generator gaps fixed, run
      `materialize-model-declares.ts` over the 28 previously-skipped models.
- [ ] Each materialized model typechecks green (`node scripts/typecheck.mjs`)
      and the AR build passes; no hand-edits to the generated declares.
- [ ] Any model that still cannot materialize correctly (e.g. Gap E
      `user-with-invalid-relation`, deliberately broken) is documented as an
      expected permanent skip, not force-written.
- [ ] PR keeps within the 500-LOC ceiling or carries an explicit generated-
      content exemption like #3545.

## Definition of done

The remaining materializable models under `test-helpers/models/` carry baked
typed declares; the only un-materialized models are documented expected skips.
