---
title: "disk-service-reads-through-file-open"
status: ready
updated: 2026-10-30
rfc: "0209-activestorage-port"
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

# DiskService reads through File.open as Rails does

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/disk_service.rb`
reads files through `File.open(path, "rb") { |file| ... }` in `download_chunk`
(`:52-60`), `compose` (`:117-125`) and the private `stream` (`:143-151`). The port
(`packages/activestorage/src/service/disk-service.ts`) reads through
`IO.binreadAsync` instead, so `parity:api:calls` reports `open` missing on all
three. The rows surfaced once `Service#open` was ported (it gave the
package a TS `open`); they carry `@missingRailsCall open — CONVERGEABLE` receipts
pointing here.

## Acceptance criteria

- `downloadChunk`, `compose` and `stream` open the file with an async
  ruby-compat `File.open` (block form) and read/seek/write through it as Rails does.
- The three `@missingRailsCall open` receipts are removed and `parity:api:calls` stays green.
