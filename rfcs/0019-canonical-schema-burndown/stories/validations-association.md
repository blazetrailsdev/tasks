---
title: "validations/association-validation → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the `validations-suite` story (its length-validation +
presence-validation files shipped in PR for that story). This file is a
**fabricated approximation** — its describe/test bodies do not match the Rails
counterpart and it declares tables inline via `defineSchema`. It needs a genuine,
word-for-word fidelity port, not a mechanical schema-ref swap.

- Source: `packages/activerecord/src/validations/association-validation.test.ts`
- Rails: `activerecord/test/cases/validations/association_validation_test.rb`

## Acceptance criteria

- [ ] Body matches the Rails counterpart word-for-word: same assertions, order,
      logic, and call structure. Test names match Rails verbatim.
- [ ] Rides `TEST_SCHEMA` (no inline `defineSchema` tables) + canonical models +
      `fixtures`/label lookups where Rails does.
- [ ] `pnpm vitest run` passes; `pnpm lint` shows zero `require-canonical-schema`
      errors; file removed from `eslint/require-canonical-schema-exclude.json`.
