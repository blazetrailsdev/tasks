---
title: "Mime registry collapses Rails' LOOKUP and EXTENSION_LOOKUP into one map, and register/register_alias diverge with it"
status: draft
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails keeps two separate registries and `register` fills them from two
different sources (`vendor/rails/actionpack/lib/action_dispatch/http/mime_type.rb:186-198`):

```ruby
def register(string, symbol, mime_type_synonyms = [], extension_synonyms = [], skip_lookup = false)
  new_mime = Type.new(string, symbol, mime_type_synonyms)
  SET << new_mime
  ([string] + mime_type_synonyms).each { |str| LOOKUP[str] = new_mime } unless skip_lookup
  ([symbol] + extension_synonyms).each { |ext| EXTENSION_LOOKUP[ext.to_s] = new_mime }
  ...
end
```

`LOOKUP` is keyed by the media-type STRING and its mime-type synonyms only —
the symbol never goes in it — and `EXTENSION_LOOKUP` is keyed by the symbol's
NAME plus the extension synonyms. `Mime::Type.lookup` reads `LOOKUP`
(`mime_type.rb:159-166`) and `lookup_by_extension` reads `EXTENSION_LOOKUP`
(`mime_type.rb:168-170`).

`packages/actionpack/src/action-dispatch/http/mime-type.ts` collapses both into
one `registry` map and puts the symbol name in it alongside the string, so
`MimeType.lookup("html")` resolves where Ruby's `LOOKUP["html"]` is nil. That
conflation is what the `MimeType.HTML`-style accessors are built on
(`static get HTML() { return MimeType.lookup("html"); }`), where Rails' `Mime[:html]`
goes through `EXTENSION_LOOKUP` / `const_missing`.

Two signature divergences follow from the same collapse:

- `register` takes no `skip_lookup` parameter, so the "register it for direct
  reference but not for lookup" case cannot be expressed.
- `register_alias(string, symbol, extension_synonyms = [])` is
  `register(string, symbol, [], extension_synonyms, true)` (`mime_type.rb:182-184`)
  — it registers a NEW type that is deliberately absent from `LOOKUP`. trails'
  `registerAlias(symbol, aliasSymbol)` is a different concept altogether: it
  points a second symbol key at an EXISTING type, and registers nothing.

Surfaced while converging `MimeType#symbol` onto the colon convention in
PR #7487, which had to route every `register` / `registerAlias` / `unregister`
key through `symbolToS` precisely because of this conflation. Left out of scope
there: splitting the registry changes `lookup`, `isRegistered`, the 25
`MimeType.X` accessors and `Mimes`/`SET`, which is its own PR.

## Converged shape

Two maps, `LOOKUP` and `EXTENSION_LOOKUP`, filled exactly as `mime_type.rb:191-192`
fills them: `LOOKUP` from `[string] + mimeTypeSynonyms` and gated on
`skipLookup`, `EXTENSION_LOOKUP` from `[symbolToS(symbol)] + extensionSynonyms`.
`register` grows the fifth parameter with Rails' name and default;
`registerAlias` takes `(string, symbol, extensionSynonyms = [])` and delegates
to `register(string, symbol, [], extensionSynonyms, true)`. The `MimeType.X`
accessors read the extension registry, which is what Ruby's `Mime[:html]`
resolves through.

## Acceptance criteria

- [ ] `register`'s parameters are `string, symbol, mimeTypeSynonyms, extensionSynonyms, skipLookup`,
      matching `mime_type.rb:186` in name, order and default.
- [ ] `LOOKUP` never receives a symbol key; `EXTENSION_LOOKUP` receives
      `symbolToS(symbol)` plus the extension synonyms.
- [ ] `registerAlias(string, symbol, extensionSynonyms)` delegates to
      `register(..., true)` and the aliased type is absent from `LOOKUP`,
      mirroring `mime_type.rb:182-184`.
- [ ] `unregister` sweeps both maps (`mime_type.rb:243-251`).
- [ ] actionpack suite green; `pnpm parity:api:calls` and
      `pnpm parity:api:params` non-negative.
