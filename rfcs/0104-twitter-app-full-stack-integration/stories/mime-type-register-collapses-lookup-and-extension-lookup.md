---
title: "Mime::Type.register collapses LOOKUP and EXTENSION_LOOKUP into one registry, has no skip_lookup, and register_alias has the wrong arity"
status: draft
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while exploring `restore-instrumentation-process-action-seat` (PR #7486),
which needed `Mime::Type.register`'s keying in front of it.

Rails keeps **two** maps and `register` writes each from a different argument
(`vendor/rails/actionpack/lib/action_dispatch/http/mime_type.rb:187-198`):

```ruby
def register(string, symbol, mime_type_synonyms = [], extension_synonyms = [], skip_lookup = false)
  new_mime = Type.new(string, symbol, mime_type_synonyms)
  SET << new_mime
  ([string] + mime_type_synonyms).each { |str| LOOKUP[str] = new_mime } unless skip_lookup
  ([symbol] + extension_synonyms).each { |ext| EXTENSION_LOOKUP[ext.to_s] = new_mime }
  ...
end
```

- `LOOKUP` is keyed by the **MIME string and its mime_type_synonyms only**, and is
  what `Mime::Type.lookup` reads (`:171-173`).
- `EXTENSION_LOOKUP` is keyed by the **symbol's `to_s` and its extension_synonyms**,
  and is what `Mime[:html]` / `lookup_by_extension` read (`:175-177`).
- `skip_lookup` suppresses the `LOOKUP` half so a type is reachable by extension
  but never matched when parsing an `Accept` header.

`packages/actionpack/src/action-dispatch/http/mime-type.ts` collapses this into one
`registry` that receives the symbol, the string AND the synonyms, plus a separate
`extensionMap`:

```ts
MimeType.registry.set(symbol, type);
MimeType.registry.set(string, type);
for (const syn of synonyms) MimeType.registry.set(syn, type);
for (const ext of [symbol, ...extensions]) MimeType.extensionMap.set(ext, type);
```

Two consequences:

1. `MimeType.lookup("html")` resolves a registered type. Rails' `Mime::Type.lookup("html")`
   does **not** — `LOOKUP` has no `:html` key, so it answers a fresh unregistered
   `Mime::Type.new("html")`. The symbol is in the wrong map.
2. `register` has no `skip_lookup` parameter at all, so the "reachable by extension,
   invisible to Accept parsing" registration Rails supports cannot be expressed.

`registerAlias` is the same gap surfacing as a different signature. Rails
(`mime_type.rb:183-185`) is

```ruby
def register_alias(string, symbol, extension_synonyms = [])
  register(string, symbol, [], extension_synonyms, true)
end
```

— it registers a **new** `Mime::Type` for an existing MIME string with the LOOKUP half
skipped. trails' is `registerAlias(symbol, aliasSymbol)`, which registers no type and
merely adds a second key pointing at an existing one. Different arity, different
argument meanings, different effect.

## Converged shape

- `register(string, symbol, mimeTypeSynonyms = [], extensionSynonyms = [], skipLookup = false)`,
  with Rails' parameter names and defaults, writing `LOOKUP` from
  `[string, ...mimeTypeSynonyms]` unless `skipLookup`, and `EXTENSION_LOOKUP` from
  `[symbolToS(symbol), ...extensionSynonyms]`.
- The single `registry` splits into the two Rails maps at the Rails names, with
  `lookup` reading `LOOKUP` and `lookupByExtension` / the `Mime[...]` reader reading
  `EXTENSION_LOOKUP`.
- `registerAlias(string, symbol, extensionSynonyms = [])` delegating to `register`
  with `skipLookup` true.
- `unregister` sweeps both maps (it already sweeps `registry` + `extensionMap`).

Expect call sites that today rely on `MimeType.lookup("html")` resolving by symbol to
move to the extension reader; `abstract-controller/collector.ts`'s `isRegistered`
is the main one.

## Acceptance criteria

- [ ] `register` carries Rails' five parameters, including `skipLookup`.
- [ ] The symbol keys `EXTENSION_LOOKUP`, not the MIME-string map, so
      `MimeType.lookup("html")` answers an unregistered type the way Rails does.
- [ ] `registerAlias` matches Rails' arity and registers a type.
- [ ] `pnpm parity:api:calls` / `:calls:args` green; no new baseline rows.
