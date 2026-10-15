---
title: "The merge spread credit pairs expression receivers; convert the eight sites left on the helper"
status: draft
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8942 converted helper `merge(` calls to `{ ...h, ...other }`, but had to leave eight sites on the helper. On these sites the Ruby receiver is an expression, not a name. The `merge` row in `scripts/api-compare/enumerable-idioms.ts:391` is `named: true`, so the `@spread` mark credits only a receiver whose name matches. Each converted site turned `parity:api:calls` red:

- `actionpack/.../action-controller/test-case.ts:576` ← `test_case.rb:61` `default_env.merge(env)` (self call)
- `routing/mapper.ts:486`, `:563` ← `mapper.rb:101`, `:150` `scope_params[:options].merge`, `scope_params[:constraints].merge`
- `routing/route-set.ts:395` ← `route_set.rb:303` `(result[:path_params] || {}).merge(result)`
- `abstract/schema-definitions.ts:663` ← `schema_definitions.rb:259` chained `.merge(...).merge(...)`
- `locking/optimistic.ts:237` ← `optimistic.rb:151` `super.merge(...)`
- `persistence.ts:686` ← `persistence.rb:746` `(options || {}).merge(all_queries: true)`
- `activesupport/ordered-options.ts:191` ← `ordered_options.rb:104` `@parent.merge(self)`

## Acceptance criteria

- [ ] The spread credit pairs a Ruby `merge` whose receiver is a self call, `super`, an `aref`, a parenthesised `||` or a chained `merge` with a leading spread of the TS spelling of that expression, with tests in `extract-ts-api.test.ts`.
- [ ] The eight sites above are converted to spreads, and `parity:api:calls` stays green with no baseline row added.
