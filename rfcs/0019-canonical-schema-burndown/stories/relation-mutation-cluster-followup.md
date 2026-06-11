---
title: "relation/ mutation cluster (cont.) → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Continuation of the `relation/` mutation cluster (the first wave landed under
`relation-mutation-cluster`, done). Convert the remaining mutation-path files
onto the canonical schema, matched to Rails.

- `relation/delete-all.test.ts` → `relation/delete_all_test.rb` (~453 LOC, 5 tbl)
- `relation/update-all.test.ts` → `relation/update_all_test.rb` (~292 LOC, 1 tbl)

Both drive `Post`/`Author`/`Comment`/`Topic` mutation paths — all canonical.
(Confirm against the exclude JSON at claim time; only convert files still
listed there.)

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open each Rails counterpart FIRST; port each body word-for-word. Test
      names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical models; rows via `fixtures` + `name(:label)` where Rails
      does.
- [ ] Each file removed from the exclude JSON; `pnpm lint` clean, no
      `eslint-disable`.
- [ ] `pnpm vitest run <each file>` passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving a file excluded
does **not** close this story.
