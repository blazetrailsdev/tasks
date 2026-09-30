---
title: "RequestEncoder keys encoders by bare name; parser strips symbol instead of Mime::Type#ref"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::RequestEncoder`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/request_encoder.rb`)
keys `@encoders` by Symbol (`{ identity: IdentityEncoder.new }`, `:16`), and
`register_encoder :html` / `:json` (`:57-58`) store under `:html` / `:json`.
`self.parser(content_type)` (`:45-48`) is
`type = Mime::Type.lookup(content_type).ref if content_type` followed by
`encoder(type)`: `ref` is the type's symbol, or its string for an
unregistered type (`mime_type.rb:284-286`), which misses `@encoders` and falls
back to `:identity`.

trails (`packages/actionpack/src/action-dispatch/testing/request-encoder.ts`)
keys `encoders` by bare names (`"identity"`, `"json"`, `"html"`). So
`parser` cannot pass `ref()` through. It reads `.symbol`, strips the colon
with `symbolToS`, and maps a null symbol to `undefined` (reshaped in
trails#8256 when `isRegistered` was removed). `IntegrationTest` callers pass
`as: "json"` where Rails passes `as: :json`
(`action-dispatch/testing/integration.ts`, `RequestEncoder.encoder(options.as)`).

## Converged shape

`encoders` keyed by the colon-prefixed Symbol string (`":identity"`,
`":json"`, `":html"`), per the repo's Ruby-Symbol convention.
`registerEncoder(":json", ...)` resolves the mime with `Mime.get(mimeName)`,
and `parser` is `encoder(contentType ? MimeType.lookup(contentType).ref() : undefined)`,
line for line with `request_encoder.rb:45-48`. `as:` takes `":json"`.

## Acceptance criteria

- [ ] `RequestEncoder.parser` is `lookup(contentType).ref()` → `encoder(type)`, with no `symbolToS`.
- [ ] Encoder keys and `as:` values are colon-prefixed symbols; `encoder` falls back to `":identity"`.
- [ ] The integration tests that pass `as:` use `":json"`, as Rails' tests pass `:json`.
