---
title: "activesupport: drop the invented terminator: false arm in Filters::Before"
status: done
updated: 2026-11-21
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10466
claim: "2026-11-21T01:09:35Z"
assignee: "activesupport-api-misses-remainder-after-bundle"
blocked-by: null
closed-reason: null
---

## Context

`Filters::Before#_callFilter` (`packages/activesupport/lib/callbacks.ts`) has an arm for `haltedLambda === false`. That arm runs the callback without any halting. `DefineCallbacksOptions.terminator` is typed `fn | false` to allow it. Rails has no such arm. `CallbackChain#initialize` always merges a terminator proc into the config (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:572-580`), and `Before#call` calls `halted_lambda.call(target, result_lambda)` unconditionally (`callbacks.rb:179`). No production caller passes `terminator: false`.

## Acceptance criteria

- [ ] Remove the `false` arm from `_callFilter` and the `| false` from the `terminator` types in `callbacks.ts`.
- [ ] Tests that pass `terminator: false` either use a proc terminator or are deleted if they have no Rails counterpart.
- [ ] The callbacks tests stay green, and `parity:api` keeps `callbacks.rb` at 100%.
