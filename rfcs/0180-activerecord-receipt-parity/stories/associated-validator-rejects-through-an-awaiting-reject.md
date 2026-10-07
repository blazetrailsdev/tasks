---
title: "activerecord: AssociatedValidator#validate_each rejects through an awaiting reject"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Validations::AssociatedValidator#validate_each`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/validations/associated.rb:6-12`) is

    if Array(value).reject { |association| valid_object?(association, context) }.any?

In trails `valid?` is async, so `packages/activerecord/src/validations/associated.ts` open-codes the
`reject` as a `for` loop that awaits `isValidObject` and pushes onto a `rejected` array. The call
gate reports the omitted `reject`; it carried `@missingRailsCall reject — PERMANENT` with no
ratifying CLAUDE.md section, and the audit in
`activerecord-audit-permanent-receipts-subsystems-part-2` re-tagged it
`CONVERGEABLE associated-validator-rejects-through-an-awaiting-reject`.

The same shape already has a story for `map`
(`preloader-through-records-by-owner-map-awaits-each-loader`). The associations must be validated
in order, one at a time, so `Promise.all` over a `filter` is not the port.

## Acceptance criteria

- [ ] `validateEach` rejects through one call the call gate credits as `reject`: a sequential,
      awaiting `reject` (shared with the awaited-`map` story's helper if that lands first), with the
      block `(association) => isValidObject(association, context)`.
- [ ] The `rejected` accumulator and the `for` loop are gone; the body reads as
      `associated.rb:9-11`.
- [ ] The `@missingRailsCall reject` receipt is deleted.
- [ ] `validations/association-validation.test.ts` stays green.
