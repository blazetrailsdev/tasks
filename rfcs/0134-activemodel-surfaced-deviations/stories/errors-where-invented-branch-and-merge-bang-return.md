---
title: "activemodel: Errors#where invents an early-return branch; mergeBang drops Rails' return value"
status: in-progress
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 30
priority: 10
pr: 7396
claim: "2026-09-02T17:16:38Z"
assignee: "attribute-user-provided-default-slot-guard-invented-throw"
blocked-by: null
closed-reason: null
---

## Context

Two errors.ts control-flow drifts against
`vendor/rails/activemodel/lib/active_model/errors.rb`:

1. Rails `where` (errors.rb:189-194) unconditionally normalizes —
   `attribute, type, options = normalize_arguments(attribute, type, **options)`
   — then filters with `error.match?(attribute, type, **options)`. trails
   (`packages/activemodel/src/errors.ts:73-75`) adds an
   `if (type === undefined)` short-circuit that skips `normalizeArguments`
   and matches on attribute alone. The branch is not Rails'; behavior
   converges only because `Error#match` tolerates an absent type.
2. Rails `merge!` (errors.rb:174-181) returns `errors` on the `equal?(other)`
   arm; trails `mergeBang` (`errors.ts:61-66`) returns `void` in both arms —
   a value-returning method ported as void (the "predicates return values"
   idiom class).

## Acceptance criteria

- `where` normalizes unconditionally and filters exactly as errors.rb:190-193,
  no invented branch.
- `mergeBang` returns what Rails returns on both arms.
- Existing `errors.test.ts` stays green; `pnpm parity:api:calls` green.
