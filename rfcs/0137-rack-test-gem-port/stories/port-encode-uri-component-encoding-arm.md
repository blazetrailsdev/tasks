---
title: "Port _encode_uri_component's enc transcode arm"
status: draft
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`URI._encode_uri_component` (`vendor/ruby/lib/uri/common.rb:385-396`) transcodes
before it escapes:

```ruby
def self._encode_uri_component(regexp, table, str, enc)
  str = str.to_s.dup
  if str.encoding != Encoding::ASCII_8BIT
    if enc && enc != Encoding::ASCII_8BIT
      str.encode!(Encoding::UTF_8, invalid: :replace, undef: :replace)
      str.encode!(enc, fallback: ->(x){"&##{x.ord};"})
    end
    str.force_encoding(Encoding::ASCII_8BIT)
  end
  str.gsub!(regexp, table)
  str.force_encoding(Encoding::US_ASCII)
end
```

`packages/ruby-compat/src/uri/common.ts`'s port (added in #7553 behind
`Rack::Utils.escape`) keeps the `enc` parameter in its Rails position and with its
`nil` default, but drops the two `encode!` calls entirely — the body opens with
`void enc;` to satisfy the unused-parameter lint. Every trails caller today reaches
it through `escape`/`encode_www_form_component` with `enc` absent, so nothing
observes the gap; a caller that passes an `enc` would silently get UTF-8 bytes
where MRI would have transcoded and emitted `&#NNNN;` numeric references for
undefined characters.

This is the `enc` half of the same encoding gap the repo has elsewhere — it needs
an `Encoding` seat in `ruby-compat` to converge, not just a change here.

## Converged shape

Once `ruby-compat` has an encoding seat that can transcode, port the two `encode!`
calls with their `invalid:`/`undef:`/`fallback:` kwargs, drop the `void enc;`
placeholder, and let `enc` do what `common.rb:387-391` does.

## Acceptance criteria

- [ ] `_encodeUriComponent` transcodes when `enc` is present, mirroring
      `common.rb:387-391`, including the `&##{x.ord};` fallback.
- [ ] `void enc;` is gone.
- [ ] `packages/ruby-compat/src/uri.trails.test.ts` covers a non-UTF-8 `enc` and an
      undefined character taking the fallback.
- [ ] `pnpm parity:api` deltas non-negative; both call gates green.
