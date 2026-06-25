---
title: "save-bang-validation-before-guards-layering"
status: claimed
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-06-25T14:33:12Z"
assignee: "save-bang-validation-before-guards-layering"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Surfaced in review of PR #3842 (persistence-test-canonical-wave11).

In Rails, `save`/`save!` run validations _before_ the readonly/destroyed guards:
`ActiveRecord::Validations#save!` calls `perform_validations` first and only on
success calls `super` → `Persistence#save!` →
`create_or_update` (persistence.rb:891-895), which is where
`_raise_readonly_record_error if readonly?` / `return false if destroyed?` live.

In trails `save()` (`packages/activerecord/src/persistence.ts`, ~line 688) the
readonly/destroyed guards sit _above_ `performValidations`. Consequence: for a
record that is both destroyed _and_ invalid, Rails `save!` raises
`RecordInvalid` (validations run first), but trails returns false from the
destroyed guard before validating, so `errors.any` is false and `save!` raises
`RecordNotSaved("Failed to save the record")` instead.

Esoteric (not exercised by current tests) but a real layering deviation from
Rails' two-phase `save!`.

## Acceptance criteria

- [ ] `save`/`save!` run validations before the readonly/destroyed guards,
      mirroring `ActiveRecord::Validations#save!` → `Persistence#create_or_update`.
- [ ] A record that is both destroyed and invalid raises `RecordInvalid` from
      `save!` (validations first), matching Rails.
- [ ] Readonly-raise and destroyed-return-false behavior preserved for the
      valid-record case.
- [ ] No regressions: `pnpm vitest run packages/activerecord/src/persistence.test.ts`,
      `callbacks.test.ts`, `validations.test.ts` pass; `pnpm lint` +
      `node scripts/typecheck.mjs` clean; test:compare/api:compare delta non-negative.
