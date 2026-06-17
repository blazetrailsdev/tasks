---
title: "hm-clients-of-firm-delete-async-validate"
status: ready
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced converting the `counting/finding/deleting` describe in
`packages/activerecord/src/associations/has-many-associations.test.ts` to
canonical `Firm`/`Client` (PR for `assoc-has-many-describes-wave3`). Three tests
are skipped pending this fix:

- `HasManyAssociationsTest > deleting`
- `HasManyAssociationsTest > deleting a collection`
- `HasManyAssociationsTest > deleting before save`

The canonical `Client` model (`test-helpers/models/company.ts`) declares
`this.validate(async function () { await this.firm; })`. The has_many
`clients_of_firm.delete` / `.build` path runs validations through trails'
synchronous `runValidationsBang` chain
(`activemodel/src/validations.ts:266` → `activesupport/src/callbacks.ts:800`),
which rejects an async `before` callback with
"Async callback on sync chain \"validate\" — before returned a Promise".

Two converge-to-Rails angles, both real deviations:

1. Rails' nullify `has_many#delete` (no `dependent:`) uses `update_all` and
   bypasses validations/callbacks entirely — trails appears to run a
   validating save on the delete-nullify path.
2. An async validation should run on the async validation runner, not the
   sync/bang chain.

## Acceptance criteria

- [ ] `clients_of_firm`-style nullify delete does not run record validations
      (matches Rails `update_all` semantics), OR async validations resolve on
      the proper async chain — converge to Rails, do not ratify.
- [ ] Un-skip the three tests above in `has-many-associations.test.ts`.
- [ ] Tests pass on sqlite + postgres.
