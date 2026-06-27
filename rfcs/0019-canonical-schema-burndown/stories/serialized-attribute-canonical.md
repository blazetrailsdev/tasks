---
title: "serialized_attribute_test.rb → canonical models + fixtures"
status: done
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 65
pr: 4204
claim: "2026-06-26T18:13:08Z"
assignee: "serialized-attribute-canonical"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/serialized-attribute.test.ts` (~992 LOC,
7 inline tables) onto the canonical schema, matched to Rails.

- trails: `serialized-attribute.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/serialized_attribute_test.rb`

Rails drives `Topic` (`content`/`serialized` columns) and `Person` with
`serialize` declarations — both canonical. The 7 inline tables here are bespoke
scratch shapes; collapse them onto the canonical `topics`/`people` tables (or
rename file-unique where a column has no `schema.rb` analog).

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] Open `serialized_attribute_test.rb` FIRST; port each body word-for-word.
      Test names unchanged.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Topic`/`Person` (+ `serialize` coders); rows via
      `fixtures` + `name(:label)` where Rails does.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/serialized-attribute.test.ts`
      passes.

## Notes

- ~992 LOC may exceed the 500-LOC PR ceiling. Split across sibling PRs off
  `main` (non-overlapping describes, NOT stacked). Ship what fits; register the
  remainder with `pnpm tasks new canonical-schema-burndown <slug>` — do not fan
  out sibling PRs yourself.

## Definition of done

Fidelity is the deliverable. An `eslint-disable` or leaving the file excluded
does **not** close this story.
