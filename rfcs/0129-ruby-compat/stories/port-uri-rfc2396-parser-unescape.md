---
title: "Port URI::RFC2396_Parser#unescape so recognize_path_with_request calls what Rails calls"
status: draft
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RouteSet#recognize_path_with_request`
(`vendor/rails/actionpack/lib/action_dispatch/routing/route_set.rb:929-934`)
unescapes every String param with `URI::RFC2396_PARSER.unescape`:

```ruby
params.each do |key, value|
  if value.is_a?(String)
    value = value.dup.force_encoding(Encoding::BINARY)
    params[key] = URI::RFC2396_PARSER.unescape(value)
  end
end
```

ruby-compat's `RFC2396Parser`
(`packages/ruby-compat/src/uri/rfc2396-parser.ts:54`) ports `escape`
(`vendor/ruby/lib/uri/rfc2396_parser.rb:287`) and `split` but NOT `unescape`
(`vendor/ruby/lib/uri/rfc2396_parser.rb:318`), so #7556 could not call what
Rails calls. It uses `unescapeUri` — trails' port of
`Journey::Router::Utils.unescape_uri`
(`vendor/rails/actionpack/lib/action_dispatch/journey/router/utils.rb:64-67,99-101`),
which is the identical `gsub` over the identical `ESCAPED` pattern, so the
behaviour matches — but the call site names a different Ruby entry point than
the Rails body does.

Porting `unescape` in #7556 was attempted and reverted: it raises ruby-compat's
RFC 0117 extra-surface `total` from 57 to 58, and that dimension is only-shrink
for a gated package (`novel` stayed 0 — the class carries a
`@noRailsEquivalent PERMANENT` receipt as MRI stdlib). No receipt can lower
`total`, so the method cannot land without a reviewed mark decision.

## Converged shape

Port `URI::RFC2396_Parser#unescape` (`vendor/ruby/lib/uri/rfc2396_parser.rb:318`)
onto `RFC2396Parser` beside `escape`, and flip
`recognizePathWithRequest`'s loop
(`packages/actionpack/src/action-dispatch/routing/route-set.ts`) from
`unescapeUri` to `RFC2396_PARSER.unescape`.

Ruby's `gsub` block yields one raw byte per escape and tags the result UTF-8;
JS strings are UTF-16, so the bytes are accumulated and decoded once at the end
(the shape `escape`'s `b()` round-trip already implies). As in `escape`, a
caller's own Regexp is re-made global because `gsub` replaces every match and
`replace` does not.

The extra-surface `total` mark for ruby-compat has to move as a reviewed step
of this story — `scripts/api-compare/extra-surface-mark.json`, currently
`{"novel": 0, "total": 57}`. That is the decision this story exists to make;
`parity:api:extra:tighten` only writes DOWN and there is no reseed, so it needs
an explicit call.

## Acceptance criteria

- [ ] `RFC2396Parser#unescape` ports `rfc2396_parser.rb:318`, with the
      `escaped` parameter defaulting to `this.regexp.ESCAPED`.
- [ ] `recognizePathWithRequest` calls `RFC2396_PARSER.unescape`, as
      `route_set.rb:932` does.
- [ ] `pnpm parity:api:extra:gate` green, with the ruby-compat `total`
      movement reviewed rather than mechanically raised.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
