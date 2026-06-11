---
title: "relation/thenable.test.ts → canonical schema (internal, no Rails counterpart)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 120
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Coverage-gap story: `packages/activerecord/src/relation/thenable.test.ts`
(~180 LOC, 3 inline tables) is still on the exclude list. It was within the
scope of `relation-mutation-cluster` (PR #3105, **done**) but was left
unconverted — this followup owns it explicitly.

- trails: `relation/thenable.test.ts`
- Rails: **no 1:1 counterpart** — trails-internal harness for the thenable
  (Promise-like `.then`) relation surface. Fidelity step 4 does not apply; bar
  is steps 1–3: ride canonical schema + models + fixtures, no inline tables.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])`; load rows via
      `name(:label)`. Canonical tables are pre-built by global setup, so the file
      calls `defineSchema` **zero** times and constructs no `createTestAdapter`.
- [ ] Delete all inline tables; ride `TEST_SCHEMA` canonical models
      (`Post`/`Author`/`Comment`). No-analog shapes stay file-unique. Test names
      unchanged.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/relation/thenable.test.ts`
      passes.

## Definition of done

Riding the canonical schema + fixtures with no inline tables. An `eslint-disable`
or leaving the file excluded does **not** close this story.
