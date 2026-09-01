---
title: "find_encoding asks TextDecoder where Ruby asks Encoding.find"
status: draft
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Multipart::Parser#find_encoding`
(`vendor/rack/lib/rack/multipart/parser.rb:489-493`) resolves a user-supplied
charset against Ruby's encoding registry, falling back to binary:

```ruby
def find_encoding(enc)
  Encoding.find enc
rescue ArgumentError
  Encoding::BINARY
end
```

trails' port (`packages/rack/src/multipart/parser.ts`) asks `TextDecoder`
instead, because there is no Ruby encoding registry reachable from TS:

```ts
try {
  new TextDecoder(enc ?? "");
  return enc!;
} catch {
  return "BINARY";
}
```

`TextDecoder` takes WHATWG labels; `Encoding.find` takes Ruby's registry,
which carries names and aliases WHATWG does not (`Shift_JIS`, `EUC-JP`,
`Windows-31J`, `ASCII-8BIT`, and dozens more), while WHATWG accepts labels
Ruby does not. The two sets overlap without being equal, so a charset one
accepts the other can reject — in both directions. A part declaring
`charset=Shift_JIS` decodes in Rails and falls to BINARY here.

The divergence is documented in `findEncoding`'s JSDoc but was not tracked.
Surfaced by review on #7362, which made `find_encoding` load-bearing: before
that PR it was the stub `enc ?? "UTF-8"` and never reached the BINARY arm at
all, so the criterion did not matter.

`forceEncoding` (`packages/ruby-compat/src/string/force-encoding.ts`) has the
same seam — it decodes via `TextDecoder` and returns the buffer unchanged
when the label has no decoder, which stands in for the BINARY fallback.

## Converged shape

A Ruby encoding registry in `ruby-compat` — `Encoding.find`'s name/alias
table mapping a Ruby encoding name to the decoder that implements it, raising
`ArgumentError` for an unknown name as Ruby does. `findEncoding` then becomes
Rails' body over it, and `forceEncoding` resolves its label through the same
table. Scope it to the encodings Rack can actually be handed rather than
MRI's full set; the point is that the accept/reject criterion is Ruby's, not
WHATWG's.

## Acceptance criteria

- `ruby-compat` exports an `Encoding.find` analogue whose accepted names and
  aliases are Ruby's, raising `ArgumentError` for an unknown name.
- `findEncoding` is Rails' body over it: `Encoding.find`, rescuing
  `ArgumentError` to binary.
- A part declaring a Ruby-only charset name (`Shift_JIS`) decodes rather than
  falling back to binary.
- `forceEncoding` resolves its encoding argument through the same registry.
