---
title: "aggregations.test.ts — retire remaining non-Rails describes + drop exclude"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["calculations-aggregations"]
deps-rfc: []
est-loc: 250
priority: 33
pr: null
claim: null
assignee: null
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Finish `packages/activerecord/src/aggregations.test.ts` (~700 LOC, 3 inline
tables). The `calculations-aggregations` story (dep) converted the
Rails-counterpart describes; this story retires the remaining trails-only
describes and drops the file from the exclude JSON.

- trails: `aggregations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/aggregations_test.rb`

Rails drives `Customer` with `composed_of` (value-object aggregations) against
canonical tables. The leftover non-Rails describes have no counterpart —
fidelity step 4 does not apply; they must still ride `TEST_SCHEMA` (no inline
tables) or be deleted if they duplicate a canonical case.

## Acceptance criteria

- [ ] For Rails-backed describes: confirm they match `aggregations_test.rb`
      word-for-word (the dep story should have done this). Test names unchanged.
- [ ] Retire/convert the remaining trails-only describes: ride `TEST_SCHEMA`,
      delete inline tables, or delete a describe that only duplicated a
      canonical case (never rename a surviving test).
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/aggregations.test.ts` passes.

## Definition of done

The file rides the canonical schema with no inline tables and is out of the
exclude JSON. An `eslint-disable` does **not** close this story.
