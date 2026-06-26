---
title: "attributes.test.ts → attributes_test.rb canonical schema port"
status: claimed
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 400
priority: 59
pr: null
claim: "2026-06-26T15:24:40Z"
assignee: "attributes-test-cluster"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/attributes.test.ts` (~730 LOC, 1 inline
table) onto the canonical schema and bring its bodies into line with Rails.

- trails: `attributes.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/attributes_test.rb`

Today the file declares its table inline via `defineSchema({...})` and uses a
bespoke `class … extends Base` instead of the Rails model. The inline schema is
the root cause of the shared-worker-DB collision flakes this RFC removes, and
the bespoke model is a fidelity gap — `attributes_test.rb` drives
`OverloadedType`/`UnoverloadedType` (`overloaded_types`) plus `Topic`, all in
`TEST_SCHEMA` already.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `attributes_test.rb` FIRST; port each body to match it word-for-word
      — same assertions, same order, same control structure. Test names stay
      byte-identical (`test:compare` matches on names).
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Replace inline `class X extends Base` with the canonical registry model;
      load rows via `fixtures` + `name(:label)` where Rails does.
- [ ] File removed from `eslint/require-canonical-schema-exclude.json`; `pnpm
lint` shows zero `require-canonical-schema` errors, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/attributes.test.ts` passes.
      Never run the whole AR suite locally.

## Definition of done

Swapping the schema but leaving bodies diverging from Rails is **not done** —
fidelity is the deliverable. An `eslint-disable` or leaving the file in the
exclude JSON does **not** close this story.
