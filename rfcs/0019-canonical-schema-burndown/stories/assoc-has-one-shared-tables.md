---
title: "Convert has-one-associations.test.ts bespoke firms/accounts/companies to canonical"
status: claimed
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-06-18T13:22:06Z"
assignee: "assoc-has-one-shared-tables"
blocked-by: null
---

## Context

Wave 2+ of `has-one-associations.test.ts` canonical burndown (follow-on to
`assoc-has-one`, PR #3466 which did the Pirate/Ship writer-assignment wave).

The bulk of the file is still a bespoke `HasOneAssociationsTest` describe using
`defineSchema(TEST_SCHEMA)` with ~30 inline tables (`firms`, `accounts`,
`companies`, plus per-test scratch shapes `del_*`, `dest_*`, `excl_*`, `casc_*`,
`touch_*`, `cpk_*`, `poly_*`, `dep_halt_*`, `dba_*`, `miss_*`, `ah_*`, …) and
bespoke `class Firm`/`class Account` registered under the canonical `Firm`/
`Account` registry names. These collide — by table shape AND registry name —
with the canonical `companies`/`accounts` fixtures, which is why they could not
be converted incrementally alongside the Pirate/Ship wave.

- trails: `associations/has-one-associations.test.ts`
- Rails: `vendor/rails/.../associations/has_one_associations_test.rb`

## Acceptance criteria

- [ ] Convert the bespoke `firms`/`accounts`/`companies` tests to canonical
      `Company`/`Firm`/`DependentFirm`/`Account` models + `companies`/`accounts`
      fixtures, porting each body verbatim from Rails.
- [ ] Rename file-unique only where a column has no `schema.rb` analog; otherwise
      converge onto the canonical tables.
- [ ] No `defineSchema` left in the file; remove it from
      `eslint/require-canonical-schema-exclude.json` in the final wave.
- [ ] Depends on `assoc-has-one-writer-persist` (canonical Account creditLimit
      validation) for the build/assign-Account tests.
