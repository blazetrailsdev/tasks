---
title: "activesupport: close the 15 missing callbacks.rb members"
status: done
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: [relocate-core-ext-enumerable-rb-methods-and-converge-sole]
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10415
claim: "2026-11-20T15:59:38Z"
assignee: "activesupport-api-callbacks-residue"
blocked-by: null
closed-reason: null
---

## Context

`parity:api --missing` lists 15 misses on `callbacks.rb`. Thirteen of them
are the `core_ext/enumerable.rb` methods, which
`relocate-core-ext-enumerable-rb-methods-and-converge-sole` owns. Two belong
here:

- `halted_lambda` (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb`, `Filters::Before`)
- `default_terminator` (`CallbackChain`, private)

## Acceptance criteria

- [ ] Port both onto their Rails owners in
      `packages/activesupport/lib/callbacks.ts`.
- [ ] Once the Enumerable relocation has landed, `parity:api` shows
      `callbacks.rb` at 100%, and `callbacks_test.rb` stays at 54/54.
