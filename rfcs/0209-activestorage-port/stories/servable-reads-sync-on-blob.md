---
title: "Blob::Servable reads and Blob#url answer synchronously on a Blob"
status: done
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: [activestorage]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9716
claim: "2026-11-04T15:46:25Z"
assignee: "servable-reads-sync-on-blob"
blocked-by: null
closed-reason: null
---

## Context

trails#9712 made `Preview#filename` / `#contentType` reach `presentation`
(`vendor/rails/v8.0.2/activestorage/app/models/active_storage/preview.rb:38`, `:127-129`), whose
`variant.processed` is async in trails. `Preview` includes `Blob::Servable` (`preview.rb:34`), so
`packages/activestorage/src/blob/servable.ts`'s `content_type_for_serving`,
`forced_disposition_for_serving`, `forcibly_serve_as_binary?` and `allowed_inline?`
(`blob/servable.rb:4-20`) became async, and with them `Blob#url` and the private
`Blob#service_metadata` (`blob.rb` url / service_metadata), which are sync in Rails and whose host
`content_type` is a sync column.

## Acceptance criteria

- `Blob#url`, `Blob#service_metadata` and the four Servable members answer synchronously on a
  `Blob` (and `Variant` / `VariantWithRecord`), as Rails' do, while `Preview` still reaches
  `presentation`.
- Blob's Servable reads are no longer awaited in `blob.ts` or `streaming.ts`.
