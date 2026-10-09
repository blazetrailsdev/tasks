---
title: "parameters-transform-keys-and-values-have-no-enumerator-arm"
status: ready
updated: 2026-10-09
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Parameters#transform_values`, `#transform_values!`,
`#transform_keys` and `#transform_keys!`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:889-919`)
each open with `return to_enum(:<name>) unless block_given?`. The ports in
`packages/actionpack/src/action-controller/metal/strong-parameters.ts`
(`transformKeys`, `transformKeysBang`, `transformValues`, `transformValuesBang`)
take a required `fn` and have no block-less arm.

Four tests in
`packages/actionpack/src/action-controller/controller/parameters/accessors.test.ts`
(`accessors_test.rb:265-273`, `:300-303`, `:311-314`) are parked `it.skip` under
a `BLOCKED:` line naming this story, each with two `@ts-expect-error` lines on
the block-less calls. Sibling `parameters-each-pair-has-no-enumerator-arm`
covers `each_pair` / `each_value` / `each_key`; `toEnum` / `Enumerator` are in
`packages/ruby-compat/src/enumerator.ts`.

## Acceptance criteria

- [ ] Each of the four methods returns `toEnum(this, "<name>")` when no block is
      given, as its first statement, with the block parameter optional.
- [ ] The four `it.skip` tests are un-skipped, their `@ts-expect-error` lines
      removed, and pass with the Rails bodies.
- [ ] `pnpm parity:api:calls` no longer reports `to_enum` missing for the four
      methods; any stale baseline rows are deleted by hand.
