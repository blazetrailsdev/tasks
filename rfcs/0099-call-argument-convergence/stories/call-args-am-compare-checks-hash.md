---
title: "call-args-am-compare-checks-hash"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6377
claim: "2026-08-11T20:50:30Z"
assignee: "arel-append-escape-inline-convergence"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0099 `call-args-tool-record-ruby-receiver-on-callsite` PR:
once the comparator compares the recorded Ruby RECEIVER against TS argument 1,
this pre-existing divergence stops hiding behind a call-name-only match.

`activemodel/lib/active_model/validations/comparability.rb:6` declares

```ruby
COMPARE_CHECKS = { greater_than: :>, greater_than_or_equal_to: :>=, … }
```

— a Hash mapping each check option to the Ruby comparison OPERATOR — and
`:11` reads `options.except(*COMPARE_CHECKS.keys)`. `comparison.rb:13`, `:20`,
`:27` and `numericality.rb:16`, `:23`, `:58`, `:60` all read the Hash: `:27`
and `numericality.rb:60` dispatch through `value.public_send(COMPARE_CHECKS[option], option_value)`.

`packages/activemodel/src/validations/comparability.ts:12` declares
COMPARE_CHECKS as the key ARRAY instead, so there is no `.keys` receiver to
pass and the operator table lives somewhere else in each consumer. Baselined at
`scripts/api-compare/call-mismatches-exclude/activemodel/validations/comparability.json`
(`error_options` / `keys` / `["const:COMPARE_CHECKS"]`); the row exists to be
deleted by this story.

## Acceptance criteria

1. `COMPARE_CHECKS` is the Rails-shaped map from check option to comparison
   operator, and `errorOptions` reads its keys as `comparability.rb:11` does.
2. `comparison.ts` and `numericality.ts` read the operator off the map at the
   sites `comparison.rb:27` / `numericality.rb:60` do, rather than re-deriving
   it.
3. The baseline row above goes stale and is deleted by hand (only-shrink).
4. `pnpm parity:api:calls:args` green; `pnpm parity:api` non-negative.
