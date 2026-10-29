---
title: "Port ActiveStorage::Service#open over Downloader"
status: draft
updated: 2026-10-29
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveStorage::Service#open` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/service.rb:89-91`) is
`ActiveStorage::Downloader.new(self).open(*args, **options, &block)`. trails#9461 ported
`packages/activestorage/src/service.ts` without it, because `Downloader` lands with
`activestorage-blob-and-downloader`.

## Acceptance criteria

- `Service#open` is ported in `service.ts` at its Rails name, async, delegating to `new Downloader(this).open(...)` with the block.
- `parity:api` credits `open` on `service.rb`.
