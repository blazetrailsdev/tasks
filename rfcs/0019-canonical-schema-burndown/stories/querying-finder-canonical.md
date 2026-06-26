---
title: "querying.test.ts + querying-methods-delegation.test.ts -> finder_test.rb canonical port"
status: in-progress
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 300
priority: 50
pr: 4191
claim: "2026-06-26T13:05:38Z"
assignee: "querying-finder-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert two trails-internal querying files onto the canonical schema and, where
a Rails analog exists, match `finder_test.rb`.

- `querying.test.ts` (~227 LOC, 1 tbl) — no 1:1 Rails file; the closest analog
  is `finder_test.rb`.
- `querying-methods-delegation.test.ts` (~151 LOC, 1 tbl) — trails-internal
  delegation harness, no Rails counterpart.

For the trails-internal describes, fidelity step 4 (body word-for-word) does not
apply — there is nothing to match. The bar reduces to: ride `TEST_SCHEMA` +
canonical models + fixtures, no inline tables. Where a test mirrors a
`finder_test.rb` case, match that body.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] For Rails-backed cases: open `finder_test.rb` and match bodies
      word-for-word. Test names unchanged throughout.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)`.
- [ ] Both files removed from the exclude JSON; `pnpm lint` clean, no
      `eslint-disable`.
- [ ] `pnpm vitest run <each file>` passes.

## Definition of done

Riding the canonical schema + fixtures with no inline tables, and matching
Rails bodies where a counterpart exists. An `eslint-disable` or leaving a file
excluded does **not** close this story.
