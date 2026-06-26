---
title: "json_serialization_test.rb → canonical models + fixtures"
status: in-progress
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 300
priority: 48
pr: 4188
claim: "2026-06-26T12:41:40Z"
assignee: "json-serialization-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/json-serialization.test.ts` (~379 LOC,
**26 inline tables**) onto the canonical schema, matched to Rails.

- trails: `json-serialization.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/json_serialization_test.rb`

Rails drives `Contact` (`contacts`) plus `Admin::User`/`Tag`/`Post` for nested
`include:` cases — all canonical. The 26 inline tables are per-test scratch
shapes (a major collision surface); collapse them onto canonical
`contacts`/`posts`/`tags`/`comments` or rename file-unique where no `schema.rb`
analog exists.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `json_serialization_test.rb` FIRST; port each body word-for-word.
      Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Contact`/`Admin::User`/`Tag`/`Post`; rows via `fixtures` +
      `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/json-serialization.test.ts`
      passes.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
