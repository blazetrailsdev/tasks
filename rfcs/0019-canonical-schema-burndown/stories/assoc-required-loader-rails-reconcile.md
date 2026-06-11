---
title: "Reconcile non-Rails tests in required/loader-methods to Rails fidelity"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["associations-eager-join-cluster"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up from `associations-eager-join-cluster` (PR #3117). That PR converted
`associations/required.test.ts` and `associations/loader-methods.test.ts` off
the `require-canonical-schema` exclude baseline by replacing `defineSchema` with
Rails-faithful `create_table`/`drop_table` (`MigrationContext`). During review
two blocks were found to have **no Rails counterpart** — they need reconciling
against the fidelity-first methodology, but that is test-coverage churn, out of
scope for a schema-mechanics PR, so it was deferred here.

Rails reference: `activerecord/test/cases/associations/required_test.rb`
(v8.0.2) defines exactly two tables — `parents` and `children` — and only the
seven `RequiredAssociationsTest` cases. Our `required.test.ts` first describe
already matches that exactly.

Two deviations to resolve:

1. **`required.test.ts` second describe `belongs_to required option`** — three
   trails-added tests (`validates presence of foreign key when required: true`,
   `passes validation when foreign key is present`, `validates has_many
children when parent saves without crashing on unloaded target`) on invented
   `r_*`/`rg_*` tables. The first two duplicate behavior already covered by the
   real `RequiredAssociationsTest` cases. The third pins a specific
   `readAttributeForValidation` guard (unloaded belongs_to target === null) —
   verify whether Rails covers this elsewhere; if it is genuinely trails-only
   regression coverage, relocate it to an appropriately-named non-Rails file
   rather than leaving it in a Rails-port-named file. Drop the redundant two.

2. **`loader-methods.test.ts`** — tests `Base#loadBelongsTo` / `Base#loadHasOne`,
   which are **trails-invented** convenience methods (base.ts:3467-3468) with no
   Rails equivalent. Legitimate unit coverage of net-new API, but it sits under
   `associations/` looking like a Rails port. Relocate/rename so it is clearly a
   trails-extension test, not a `*_test.rb` counterpart (it will never have a
   `test:compare` match by design).

## Acceptance criteria

- [ ] No test in `required.test.ts` lacks a Rails counterpart: the
      `belongs_to required option` describe's redundant cases are removed; any
      genuinely trails-only regression test is relocated to a non-Rails-named
      file with a comment explaining the invariant it pins.
- [ ] `loader-methods.test.ts` is relocated/renamed to signal it covers
      trails-only API (`loadBelongsTo`/`loadHasOne`), not a Rails port.
- [ ] No invented `r_*`/`rg_*`/`lo_*` tables remain in files named after Rails
      test files; surviving scratch tables live only in clearly trails-local
      files and still use `create_table`/`drop_table` (no `defineSchema`).
- [ ] `pnpm vitest run` passes for all touched files; no new
      `require-canonical-schema` exclusions.
