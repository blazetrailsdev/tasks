---
title: "mime-type-register-alias-signature-and-skip-lookup"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mime::Type.register_alias(string, symbol, extension_synonyms = [])`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:182-184`) is
`register(string, symbol, [], extension_synonyms, true)`. It creates a new `Type`
for an existing string and skips the LOOKUP entry (`skip_lookup`, `:186-200`).

trails' `MimeType.registerAlias(symbol, aliasSymbol)`
(`packages/actionpack/src/action-dispatch/http/mime-type.ts`) takes two symbols
and points the alias at the existing type object. `MimeType.register` has no
`skipLookup` parameter. Because the alias shares the original type object,
`MimeType.unregister(":alias")` deletes every registry entry for that type,
including the original (`:html`).

This blocked porting `respond_to_test.rb`'s setup verbatim
(`Mime::Type.register_alias("text/html", :iphone)`, `:333`) in
`packages/actionpack/src/action-controller/controller/mime/respond-to.test.ts`.

## Acceptance criteria

- `register` takes `skipLookup` (default `false`) and skips the LOOKUP write when it is set, as Rails does.
- `registerAlias(string, symbol, extensionSynonyms = [])` delegates to `register(string, symbol, [], extensionSynonyms, true)`.
- `respond-to.test.ts`'s setup/teardown registers and unregisters `:iphone` as Rails does.
