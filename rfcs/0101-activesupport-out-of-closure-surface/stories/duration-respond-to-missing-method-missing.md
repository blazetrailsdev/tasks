---
title: "Duration ports respond_to_missing? / method_missing as named methods"
status: draft
updated: 2026-10-25
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Duration` forwards every unknown method to its value: `respond_to_missing?(method, _)` returns `value.respond_to?(method)`, and `method_missing(...)` calls `value.public_send(...)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/duration.rb:512-518`). trails' `packages/activesupport/src/duration.ts` ports neither. Root CLAUDE.md's table marks `duration.rb` as "nothing". As a result `rbObjRespondTo(duration, "toR")` is false, and MRI's `num_exact_check` default arm (`vendor/ruby/v3.3.11/time.c:518-559`) cannot reach `to_r` / `to_int`. This blocks `time-at-num-exact-check-default-arm`.

## Acceptance criteria

- Duration ports `respondToMissing` and `methodMissing` under their Rails names, following the "named method, no trap" row of root CLAUDE.md § "Ruby protocol methods with a different JS mechanism".
- `methodMissing` forwards to `this.value` the way `public_send` does. The name is caller-supplied, so `rbFSend` is the sanctioned shape.
- The CLAUDE.md table row for `duration.rb` is updated.
- Depends on `ruby-compat-integer-to-r-to-int-dispatch`, so that `rbObjRespondTo(30, "toR")` is true.
