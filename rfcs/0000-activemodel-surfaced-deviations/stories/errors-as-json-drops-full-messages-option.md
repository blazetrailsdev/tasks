---
title: "activemodel: Errors#asJson drops the full_messages option"
status: ready
updated: 2026-09-01
rfc: "0000-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `Errors#as_json(options = nil)` is
`to_hash(options && options[:full_messages])`
(`vendor/rails/activemodel/lib/active_model/errors.rb:246-248`), so
`errors.as_json(full_messages: true)` returns full messages.

trails `asJson(_options?)` (`packages/activemodel/src/errors.ts:108-114`)
ignores its argument and always calls `this.toHash(false)`. Silent: the ported
tests pass while `as_json(full_messages: true)` returns short messages.

Note the Ruby guard is `options && options[:full_messages]` — Ruby truthiness,
false only for `nil`/`false` — so port it as
`options != null && options !== false ? options.fullMessages : undefined`
shape, not `Boolean(options)`.

## Acceptance criteria

- `asJson(options)` forwards `options?.fullMessages` to `toHash` exactly as
  errors.rb:247 does, including the nil-options arm.
- A regression test (mirroring the Rails behavior in `errors_test.rb`'s
  as_json coverage) that fails on the current body.
- `pnpm parity:api:calls` stays green for `errors.ts`.
