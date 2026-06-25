---
title: "constructor-form-and-hmt-insert.test.ts → canonical (internal, no Rails counterpart)"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 150
priority: 18
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Coverage-gap story: `packages/activerecord/src/associations/constructor-form-and-hmt-insert.test.ts`
(~201 LOC, 6 inline tables) is on the exclude list with **no owning story**.

- trails: `associations/constructor-form-and-hmt-insert.test.ts`
- Rails: **no 1:1 counterpart** — trails-internal harness for the
  constructor-form `has_many :through` insert path. Fidelity step 4 (body
  word-for-word) does not apply; the bar is steps 1–3: ride the canonical schema
  - canonical models + fixtures, no inline tables.

The 6 inline tables are collision-avoidance gensyms for the canonical
`Author`/`Post`/`Tagging`/`Tag` through-insert shape; rewrite onto those.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])`; load rows via
      `name(:label)`. Canonical tables are pre-built by global setup, so the file
      calls `defineSchema` **zero** times and constructs no `createTestAdapter`.
- [ ] Delete all inline tables; ride `TEST_SCHEMA` canonical models
      (`Author`/`Post`/`Tagging`/`Tag`). A shape with no `schema.rb` analog stays
      file-unique (scoped `defineSchema` + teardown), never the shared name.
- [ ] Test names unchanged; where a body mirrors a Rails case, match it.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/constructor-form-and-hmt-insert.test.ts`
      passes (co-run colliding siblings under `maxForks=1`).

## Definition of done

Riding the canonical schema + fixtures with no inline collision tables. An
`eslint-disable` or leaving the file excluded does **not** close this story.
