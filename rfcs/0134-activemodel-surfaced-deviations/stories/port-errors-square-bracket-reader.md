---
title: "activemodel: port Errors#[] — the one genuinely missing errors.rb method"
status: ready
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 15
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api` reports one true absence in errors.rb: `[]` → expected TS `get`
(`vendor/rails/activemodel/lib/active_model/errors.rb:229-231`:
`def [](attribute); messages_for(attribute); end`).

`packages/activemodel/src/errors.ts` has no `get(attribute)` method — the
`messages` getter (errors.ts:116-120) patches `Map.prototype.get` onto its
returned hash, which is a different surface. Note Ruby's `[]` takes the
attribute raw (no `to_sym` in the body — `messages_for` handles
normalization via `where`).

## Acceptance criteria

- `Errors#get(attribute)` delegating to `messagesFor`, exactly
  errors.rb:229-231, placed in Rails source order.
- The corresponding `errors_test.rb` square-bracket tests match (they already
  count as matched only if present — verify with `pnpm parity:test`).
- `parity:api --package activemodel` misses for errors.rb drop 1 → 0.
