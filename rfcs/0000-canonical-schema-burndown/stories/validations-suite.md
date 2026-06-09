---
title: "validations/ suite → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-09
rfc: "0000-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the `validations/` files (RFC §Rollout phase 1). Each maps cleanly to a
Rails `activerecord/test/cases/validations/*_test.rb` counterpart and uses small,
canonical-shaped models (Topic, Person, …), so it is high-fidelity / low-risk.

Files (remove each from `require-canonical-schema-exclude.json` as it lands):

- `validations/association-validation.test.ts` → `validations/association_validation_test.rb`
- `validations/length-validation.test.ts` → `validations/length_validation_test.rb`
- `validations/numericality-validation.test.ts` → `validations/numericality_validation_test.rb`
- `validations/presence-validation.test.ts` → `validations/presence_validation_test.rb`
- `validations/uniqueness-validation.test.ts` → `validations/uniqueness_validation_test.rb`
- `validations/validations.test.ts` → `validations_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` (no inline `defineSchema` tables) + canonical
      models + `fixtures :name` / `name(:label)` lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word: same assertions,
      same order, same logic, same call structure. Test names unchanged.
- [ ] `pnpm vitest run` passes for each touched file; `pnpm lint` shows zero
      `require-canonical-schema` errors; files removed from the exclude JSON.

## Notes

- `length-validation.test.ts` is already body-ported (memory
  `lengthvalidation_fixture_parity_blocked`) — likely a near-mechanical schema-ref
  swap; still verify body fidelity against Rails.
- Split across sibling PRs off `main` (non-overlapping files) to stay ≤500 LOC.
