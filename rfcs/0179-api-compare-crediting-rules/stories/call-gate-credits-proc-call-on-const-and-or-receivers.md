---
title: "parity: credit Proc#call on const-path and || receivers"
status: done
updated: 2026-10-03
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8447
claim: "2026-10-03T16:08:09Z"
assignee: "call-gate-credits-concurrent-array-new"
blocked-by: null
closed-reason: null
---

## Context

trails#8435 taught the call-set gate that Ruby `x.call(...)` (`Proc#call`) is credited when the paired TS body invokes `x(...)`. The rule reads the Ruby receiver's name (`callReceiverNames`, extract-ruby-api.rb `RECEIVER_NAMED_CALLS`) and admits only named receivers of kind other than `const`, `self` and `array` (`NATIVE_FORM_ANALOGUES` `call`, scripts/api-compare/enumerable-idioms.ts). Seven `@missingRailsCall call — CONVERGEABLE` receipts fall outside it:

- `packages/activerecord/src/database-configurations.ts` `defaultEnv`: `ActiveRecord::ConnectionHandling::DEFAULT_ENV.call.to_s` (`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations.rb:189`). The receiver is a const path, so `receiver_tail_name` yields nil (`?`) and the kind is `const`. The TS body is `ActiveRecord.ConnectionHandling.DEFAULT_ENV()`.
- `packages/activerecord/src/database-configurations/database-config.ts` `for_current_env?`: the same `DEFAULT_ENV.call` shape.
- `packages/activerecord/src/migration.ts` ×4 (`env`, `current_environment`, `copy`, `build_watcher`): const-path or block receivers.
- `packages/activerecord/src/statement-cache.ts` `create`: `(callable || block).call Params.new` (`statement_cache.rb:133`). The receiver is a parenthesised expression with no tail name, and the TS body is `callable(new Params())`.

## Acceptance criteria

- [ ] `receiver_tail_name` names a const-path receiver by its last segment (`DEFAULT_ENV`), and the `call` analogue credits a const receiver whose constant the TS body invokes, with unit tests for both arms.
- [ ] An `||` receiver (`(callable || block).call`) is credited when the TS body invokes one of its operands, with a test; a body that invokes neither still flags.
- [ ] Each receipt the rule then covers is deleted. Any receipt it still does not cover is listed in the PR body with its reason. `pnpm parity:api:calls` and `pnpm parity:api:receipts:gate` stay green with no baseline row added.
