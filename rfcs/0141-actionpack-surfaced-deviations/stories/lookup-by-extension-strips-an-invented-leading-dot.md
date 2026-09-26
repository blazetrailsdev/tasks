---
title: "Mime::Type.lookup_by_extension strips an invented leading dot"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mime::Type.lookup_by_extension(extension)` is
`EXTENSION_LOOKUP[extension.to_s]`
(`vendor/rails/actionpack/lib/action_dispatch/http/mime_type.rb:175-177`) — no
normalization beyond `to_s`.

trails' `MimeType.lookupByExtension`
(`packages/actionpack/src/action-dispatch/http/mime-type.ts`) additionally
strips a leading dot (`.replace(/^\./, "")`), so `lookupByExtension(".html")`
resolves where Rails returns nil. Callers that rely on it should strip the dot
themselves as their Rails counterparts do (e.g. `raw_file.rb:11`'s
`::File.extname(filename).delete(".")`).

## Converged shape

`lookupByExtension` does only the Symbol `to_s` and the map read; any caller
passing a dotted extension is fixed at the call site.

## Acceptance criteria

- `MimeType.lookupByExtension(".html")` is `undefined`, as in Rails.
- actionpack suite green.
