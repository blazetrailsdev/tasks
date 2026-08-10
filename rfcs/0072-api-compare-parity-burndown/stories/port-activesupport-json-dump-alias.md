---
title: "Port ActiveSupport::JSON.dump, the alias of encode"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 6140
claim: "2026-08-05T20:13:09Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #6134 (`activesupport-json-encoding-jsongemencoder-port`).

`vendor/rails/activesupport/lib/active_support/json/encoding.rb:39-43` defines
both names on the `ActiveSupport::JSON` singleton:

```ruby
def encode(value, options = nil)
  Encoding.json_encoder.new(options).encode(value)
end
alias_method :dump, :encode
```

`packages/activesupport/src/json.ts` ports `encode` — #6134 converged it onto
the Rails one-liner — and `decode`, but not `dump`. Rails' `dump` is a plain
alias, so the converged shape is trivial; it is a real public-surface gap, not a
naming question.

Attribution note: `json.rb` itself is only two `require`s, so parity:api
attributes the `module JSON` half of `json/encoding.rb` to `json.ts` while the
`module Encoding` half scores against `json/encoding.ts` (13/13 as of #6134).
That means `dump` does not show up as a miss on `json/encoding.rb`'s score — it
sits in the `json.ts` attribution, which is why it went unnoticed. Confirm where
the comparison expects it before adding, so the fix actually registers.

Callers: `ActiveSupport::JSON.dump` is what `Object#to_json` reaches in Rails, so
anything porting `to_json` later will want it present.

## Converged shape

`json.ts` exports `dump` as an alias of `encode`, at Rails' name, with the same
signature and defaults — Ruby's `alias_method :dump, :encode` (encoding.rb:43).
No second implementation, no re-traversal.

## Acceptance criteria

- [ ] `ActiveSupportJSON.dump` exists, aliasing `encode` with an identical
      signature (`(value: unknown, options?: EncodeOptions) => string`), not a
      reimplementation.
- [ ] Verify against `pnpm parity:api` which TS file the comparison expects
      `ActiveSupport::JSON#dump` in; if it is attributed to `json.ts`, the score
      for that attribution rises. If the attribution turns out to be wrong,
      file that separately rather than moving code to satisfy it.
- [ ] Any Rails test in `vendor/rails/activesupport/test/json/encoding_test.rb`
      that exercises `dump` is ported with its name verbatim; if none does, no
      test is invented for it beyond a `.trails.test.ts` smoke case.
- [ ] `pnpm parity:api:extra --package activesupport` reports no new novel names.
