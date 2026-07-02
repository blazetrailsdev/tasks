---
title: "Phase 4: retire defineSchema + one-schema apparatus + irrelevant eslint rules (terminal)"
status: ready
updated: 2026-07-02
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps:
  [
    "delete-canonical-defineschema-calls",
    "convert-bespoke-defineschema-pg-adapters",
    "convert-bespoke-defineschema-mysql-adapters",
    "convert-bespoke-defineschema-associations-eager",
    "convert-bespoke-defineschema-associations-rest",
    "convert-bespoke-defineschema-relation",
    "convert-bespoke-defineschema-core-persistence",
    "convert-bespoke-defineschema-encryption-validations",
    "convert-bespoke-defineschema-test-helpers",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails fidelity above all else.** Phase 4 (depends on phase 2 + all phase-3 conversion stories) —
the terminal cleanup. Only runnable once `git grep -c defineSchema
packages/activerecord/src` is 0.

Delete the trails invention and everything built around it:

- `defineSchema` / `DefineSchemaOpts` (`test-helpers/define-schema.ts`) and
  `test-helpers/define-schema.test.ts` (tests defineSchema itself).
- `test-helpers/one-schema.ts` (`assertCanonicalSchema`, `OneSchemaViolation`,
  `oneSchemaMode`, `canonicalTableNames`), the `AR_ONE_SCHEMA` reads, the vitest
  `ONE_SCHEMA_EXCLUDE` block, and `eslint/one-schema-exclude.json`.
- **All eslint rules rendered irrelevant by removing `defineSchema`/`TEST_SCHEMA`.**
  This is the explicit tail of the RFC: end by deleting every rule (+ its exclude
  json + `eslint.config.mjs` wiring) that only existed to police this surface.
  Audit with `git grep -lE "defineSchema|TEST_SCHEMA|one.schema" eslint/`. Known
  as of 2026-07-02:
  - `blazetrails/require-canonical-schema` (+ `require-canonical-schema-exclude.json`)
    — polices `defineSchema` args; wholly irrelevant once `defineSchema` is gone.
  - `blazetrails/use-fixtures-schema` — requires a `{ schema: <*_SCHEMA> }` option
    on the `useFixtures` name-array form, keyed on `defineSchema`/`TEST_SCHEMA`;
    remove or rework once the `TEST_SCHEMA` object no longer exists.
    Do NOT remove rules that stay relevant (e.g. `require-table-teardown`, which
    becomes MORE important once tests use `create_table` directly).
- The `TEST_SCHEMA` object (`test-helpers/test-schema.ts`) if nothing but the
  retired paths referenced it (the canonical loader from phase 1 is the source now).

## Acceptance criteria

- `git grep -c defineSchema packages/activerecord/src` -> 0.
- No `AR_ONE_SCHEMA` / "one schema" / `OneSchemaViolation` strings remain
  (`git grep -i "one.schema" packages/ eslint/ scripts/` -> 0).
- `one-schema-exclude.json` deleted; and EVERY eslint rule made irrelevant by
  this work removed (`require-canonical-schema` + its exclude; `use-fixtures-schema`
  removed/reworked; audit sweep clean). This is the final step of the RFC.
- `test:compare` delta >= 0; no test renames.
