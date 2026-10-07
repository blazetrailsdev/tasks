---
title: "ActionController::Parameters names its hash _data where Rails has @parameters"
status: done
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8621
claim: "2026-10-07T11:03:12Z"
assignee: "strong-parameters-hash-field-is-data-not-parameters"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Parameters` holds its hash in `@parameters`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`, set in `initialize`
and read through the protected `attr_reader :parameters`). trails' port,
`packages/actionpack/src/action-controller/metal/strong-parameters.ts`, names the field `_data` (88
uses in that file, plus readers outside it).

The call-argument report files this as `naming` rows. After trails#8558, `fetch` alone has two:
`fetch(ref:parameters, ref:key)` against `fetch(ref:_data, ref:key)`, and `keys(ref:parameters)` against
`keys(ref:_data)` (`strong_parameters.rb:820-831`). `naming` rows are report-only for actionpack today
(`pnpm parity:api:calls:args:report`), so no gate catches it.

## Acceptance criteria

- [ ] The field is spelled `parameters`, the camelCase of Rails' `@parameters`, with Rails' protected reader.
- [ ] Every reader inside and outside `strong-parameters.ts` uses the new name; no `_data` alias remains.
- [ ] `pnpm parity:api:calls:args:report` shows no `ref:_data` row for `metal/strong-parameters.ts`.
