---
title: "ruby-compat-async-file-open"
status: draft
updated: 2026-10-29
rfc: "0154-ruby-compat-surfaced-deviations"
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

ruby-compat's `File` handles read and write through the fs adapter's sync
`readSync` / `writeSync` (`packages/ruby-compat/src/io.ts`, `IO.copyStream`),
and the async adapter (`packages/ruby-compat/src/fs-adapter.ts`) has only
whole-file `readFile` / `writeFile`. So `ActiveStorage::Service::DiskService`
(`packages/activestorage/src/service/disk-service.ts`) cannot write Rails'
`File.open(path, "rb") { |f| f.seek range.begin; f.read range.size }`
(`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/disk_service.rb:42-51`),
`stream`'s `file.read(5.megabytes)` loop (`:145-153`) or `compose`'s
`File.open(..., "w")` + `IO.copy_stream` (`:105-113`) over async I/O; it uses
`IO.binreadAsync(name, length, offset)`, which reads the whole file, and
carries `@missingRailsCall open|seek|copy_stream — CONVERGEABLE` receipts.

## Acceptance criteria

- The fs adapter gains an async file-handle (`open` / positional `read` /
  `write` / `close`), and ruby-compat an async `File.open` block form whose
  `read(length)`, `seek` and `IO.copy_stream` are awaited.
- `DiskService#download_chunk`, `#stream` and `#compose` are rewritten in
  Rails' shape over it, and their receipts removed.
- `IO.binreadAsync` reads only `length` bytes from `offset`.
