---
title: "Deflater stores @compressible_types as `include` and splits should_deflate?'s combined guard"
status: in-progress
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7551
claim: "2026-09-06T12:18:19Z"
assignee: "bigdecimal-round-diverges-from-mri-on-negative-ndigits"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Deflater`'s ivar is `@compressible_types`
(`vendor/rack/lib/rack/deflater.rb:41`, read at `:146`), set from the
`:include` option. `packages/rack/src/deflater.ts` stores it as `this.include`
instead — the _option key_ name, not the ivar name. The Rails-facing option
key `:include` is correct on `DeflaterOptions`; only the field is misnamed.

`should_deflate?` also diverges in shape. Ruby is one combined guard
(`deflater.rb:139-143`):

```ruby
if Utils::STATUS_WITH_NO_ENTITY_BODY.key?(status.to_i) ||
    /\bno-transform\b/.match?(headers[CACHE_CONTROL].to_s) ||
    headers['content-encoding']&.!~(/\bidentity\b/)
  return false
end
```

trails (`deflater.ts:89-93`) splits that into three separate `if ... return
false` statements, and spells the header key as the literal `"cache-control"`
where Ruby uses the `CACHE_CONTROL` constant — which trails already exports
(`packages/rack/src/constants.ts:21`) and already imports in this file for
`CONTENT_TYPE`/`CONTENT_LENGTH`.

Found while converging `Deflater#call` in #7532; out of scope there, which
only touched `call`.

## Converged shape

- Rename the field to `compressibleTypes`, keeping the `:include` option key.
- Restore the single three-arm `||` guard, using `CACHE_CONTROL`.
- Port `&.!~` faithfully: Ruby returns `nil` (falsy) when `content-encoding` is
  absent, and `true` only when present AND not matching `/\bidentity\b/`.

## Acceptance criteria

- [ ] `this.include` is `this.compressibleTypes`; the `:include` option key is
      unchanged.
- [ ] `shouldDeflate`'s first guard is one `if` with the same three arms in
      Rails' order, reading `headers[CACHE_CONTROL]`.
- [ ] `packages/rack/src/deflater.test.ts` stays green on every existing case.
