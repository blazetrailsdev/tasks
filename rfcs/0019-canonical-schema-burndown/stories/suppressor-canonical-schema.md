---
title: "suppressor.test.ts → canonical Notification/User (needs save-suppression impl fix)"
status: done
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 120
priority: 14
pr: 4147
claim: "2026-06-25T20:02:15Z"
assignee: "suppressor-canonical-schema"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/suppressor.test.ts` (~229 LOC, 8 inline
tables) onto the canonical schema, matched to Rails. This story may also need a
small **implementation fix** to `ActiveRecord::Suppressor` (save-suppression).

- trails: `suppressor.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/suppressor_test.rb`

Rails drives `Notification`/`User` where creating a `User` would normally create
a `Notification`, but `Notification.suppress { … }` suppresses the dependent
save — both canonical models.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `suppressor_test.rb` FIRST; port each body word-for-word. Test names
      unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Notification`/`User`; rows via `fixtures` + `name(:label)`
      where Rails does.
- [ ] If a faithful Rails body fails because `suppress` does not actually
      prevent the dependent save, fix `Suppressor` — do NOT weaken the test.
      Cite the Rails source in the PR.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/suppressor.test.ts` passes.

## Definition of done

Fidelity is the deliverable; if an impl gap blocks a faithful body, fix the
impl. An `eslint-disable` or leaving the file excluded does **not** close this
story.
